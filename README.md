# numbat-influx

An influx 0.9+ adapter for the [numbat](https://github.com/ceejbot/numbat-collector)-powered metrics system.

[![npm](http://img.shields.io/npm/v/numbat-influx.svg?style=flat)](https://www.npmjs.org/package/numbat-influx) [![Tests](http://img.shields.io/travis/ceejbot/numbat-influx.svg?style=flat)](http://travis-ci.org/ceejbot/numbat-influx) ![Coverage](http://img.shields.io/badge/coverage-100%25-green.svg?style=flat)    [![Dependencies](https://david-dm.org/ceejbot/numbat-influx.svg)](https://david-dm.org/ceejbot/numbat-influx)

## Usage

Pass it the same options you'd pass the [node influx](https://github.com/node-influx/node-influx) client.

The following additional options are respected:

* `requestTimeout` - number of milliseconds to wait before timing out an http post to influxdb (passed on to request)
* `batchSize` - number of points to accumulate before writing them as a batch to influxdb
* `batchTimeout` - number of milliseconds to allow a batch to accumulate before writing it anyway

## LICENSE

ISC
