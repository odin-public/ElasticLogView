ElasticLogView
===========

This project aims to provide a simple interface for viewing logs streaming in real-time.

![elv_load_stream](https://cloud.githubusercontent.com/assets/991591/8655408/8d00f014-2999-11e5-9658-105913b0e2d0.png)


## Architecture

ElasticLogView is written entirely in JavaScript using ElasticSearch browser
build for AngularJS. It's only back-end is ElasticSearch instance providing REST
API to its data.

ElasticLogView operates by continuous polling the back-end for the latest
records based on `baseFilterField` field and runs aggregations to collect
values for filters and provide some basic stats on how many distinct values
are there in DB.


## Configuration

Edit `js/config.js` file to specify ElasticSearch parameters and provide
low-level custom callbacks for mapping and stylizing output values.

The configuration file is heavily documented to help you specify custom values.

Most commonly changed parameters are `esHost`, `indexPattern` - specify your
ElasticSearch instance and index pattern (which is parsed exactly like in
Kibana 3) respectively.

Be sure to set `baseFilterField` and `baseFilterValidator` which are used to
find and validate distinct records to show in the user session. Also, the
base filter is the only required position URL argument. `baseFilterValidator`
function by default validates a UUID value.


## Installation

1. Run `npm install` after cloning to update all required dependencies.
1. Run `bower install` to upload lib sources
1. Run `grunt` to build all sources
