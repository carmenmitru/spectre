/*
 * spectre
 * http://spectre.is
 *
 * Copyright (c) 2015 Fabian Becker
 * Licensed under the MIT license.
 * https://github.com/spectre/spectre-tracker/blob/master/LICENSE-MIT
 */
'use strict';
var EventEmitter = require('events').EventEmitter,
    ua           = require('ua-parser-js'),
    _            = require('lodash'),
    util         = require('util');

function Tracker() {
    EventEmitter.call(this);

    // ToDo: Make sure database connection is valid

}

util.inherits(Tracker, EventEmitter);

Tracker.prototype.track = function (data, err) {
    this.emit('track.new', data);

    // ToDo: Store data in Database

    // ToDo: Figure out how to fetch website data
};

module.exports = Tracker;
