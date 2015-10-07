var
	_      = require('lodash'),
	assert = require('assert'),
	bole   = require('bole'),
	Influx = require('influx'),
	stream = require('stream'),
	util   = require('util')
;

var InfluxOutput = module.exports = function InfluxOutput(opts)
{
	assert(opts && _.isObject(opts), 'you must pass an options object');
	assert(opts.hosts && _.isArray(opts.hosts), 'you must pass an array in the `hosts` option');
	assert(opts.username && _.isString(opts.username), 'you must pass a `username` option');
	assert(opts.password && _.isString(opts.password), 'you must pass a `password` option');
	assert(opts.database && _.isString(opts.database), 'you must pass a `database` option');

	stream.Writable.call(this, { objectMode: true });
	if (!opts.requestTimeout) opts.requestTimeout = 65000; // in ms

	this.options = opts;
	this.client = Influx(opts);

	this.batch = {};
	this.batchLength = 0;
	// Default to 1 to be backwards-compatible.
	this.batchSize = opts.batchSize || 1;

	this.log = bole('influx-9');
	this.log.info('influx output configured for ' + opts.database);
};
util.inherits(InfluxOutput, stream.Writable);

InfluxOutput.prototype.client    = null;
InfluxOutput.prototype.errcount  = 0;
InfluxOutput.prototype.lasterror = 0;
InfluxOutput.prototype.THROTTLE  = 300000; // 5 minutes

InfluxOutput.prototype.toString = function toString()
{
	return '[ InfluxDB ' + this.options.database + ' @ ' +
		_.map(this.options.hosts, function(h) { return h.host; }).join(', ') +
		' ]';
};

InfluxOutput.prototype._write = function _write(event, encoding, callback)
{
	if (event.name === 'heartbeat') return callback();
	var point = { value: event.value };

	var tags = _.pick(event, function(v, k)
	{
		if (k === 'time') return false;
		if (k === 'value') return false;
		if (k === 'name') return false;
		return !_.isObject(v) && !_.isArray(v);
	});

	if (event.time)
		point.time = event.time;
	if (point.time && typeof point.time !== 'object')
		point.time = new Date(point.time);

	var self = this;

	++self.batchLength;
	if (!self.batch[event.name])
		self.batch[event.name] = [[point, tags]];
	else
		self.batch[event.name].push([point, tags]);

	if (self.batchLength >= self.batchSize)
	{
		var batch = self.batch;
		self.batch = {};
		self.batchLength = 0;
		self.client.writeSeries(batch, function(err)
		{
			if (err)
			{
				// throttle error reporting
				if (self.lasterror + self.THROTTLE < Date.now())
				{
					self.lasterror = Date.now();
					if (self.errcount > 0)
						self.log.error(self.errcount + ' error(s) writing points to influx suppressed');
					else
					{
						self.log.error('failure writing a point to influx:');
						self.log.error(event.name, point);
						self.log.error(err);
					}
					self.errcount = 0;
				}
				else
					self.errcount++;
			}
		});
	}

	// we are firing & forgetting.
	callback();
};
