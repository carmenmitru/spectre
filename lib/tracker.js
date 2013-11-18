/*
 * spectre
 * http://spectre.is
 *
 * Copyright (c) 2013 Fabian Becker
 * Licensed under the MIT license.
 * https://github.com/spectre/spectre-tracker/blob/master/LICENSE-MIT
 */
var EventEmitter = require('events').EventEmitter,
    ua           = require('user-agent-parser'),
    _            = require('underscore'),
    util         = require('util');

function Tracker() {
    EventEmitter.call(this);

    // ToDo: Make sure database connection is valid

}

util.inherits(Tracker, EventEmitter);

Tracker.prototype.track = function (data) {
    this.emit('new visit', data);

    // ToDo: Store data in Database

    // ToDo: Figure out how to fetch website data
}

module.exports = Tracker;
