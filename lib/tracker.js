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
    _            = require('lodash'),
    knex         = require('knex'),
    moment       = require('moment'),
    path         = require('path'),
    util         = require('util');

function Tracker() {
  EventEmitter.call(this);

  // ToDo: Make sure database connection is valid
  this._buffer = [];

  this._config = {
    granularity: 'minute',
    processedPeriods: ['month', 'week', 'day', 'hour'],
    retention: {
      'minute': 1440, // A day
      'hour': 168, // A week
      'day': 31, // A month
      'month': 24, // Two years
      'year': 0 // Forever
    },
    database: {
      client: 'sqlite3',
      connection: {
        filename: path.join(__dirname, '../development.sqlite3')
      },
      debug: true
    },
    forceSync: false
  };

  this._knex = knex(this._config.database);
  migrateToLatest(this._knex, {
    directory: path.join(__dirname, '../migrations')
  }).then(function () {
    console.log("Migrated!");
  });
}

util.inherits(Tracker, EventEmitter);

Tracker.prototype.track = function (uuid, resource_type, event_name, options) {
  var self = this,
      forceSync;

  if (!uuid || !resource_type || !event_name) {
    throw new Error('Missing arguments');
  }

  if (_.isUndefined(options)) {
    options = {};
  }

  forceSync = !!options.forceSync || false;
  delete options.forceSync;

  function storeEvent(uuid, resource_type, event_name, options) {
    var document = { uuid: uuid, resource_type: resource_type, event_name: event_name },
        data,
        category;

    addTimestamp(document, self._config.granularity);
    data = _.findWhere(self._buffer, document);
    // Push document if it doesn't exist
    if (_.isUndefined(data)) {
      data = _.extend(document, { value: 0, categories: [] });
      self._buffer.push(data);
    }

    // Always count the event
    data.value = data.value + 1;

    // Now count the category
    if (options.category) {
      category = _.findWhere(data.categories, addTimestamp({ name: options.category }, self._config.granularity));

      if (_.isUndefined(category)) {
        category = { name: options.category, value: 0 };
        data.categories.push(category);
      }

      category.value = category.value + 1;
    }

    // Emit event with uuid and passed options
    self.emit(resource_type + '.' + event_name, _.extend(
      { uuid: uuid }, options
    )); 

    if (isSubEvent(event_name)) {
      var parentName = event_name.substring(0, _.indexOf(event_name, '.'));

      // We only track the cateogry for the deepest level
      delete options.category;
      storeEvent(uuid, resource_type, parentName, options);
    }
  }

  storeEvent(uuid, resource_type, event_name, options);   

  // If sync is forced perform write operations directly
  if (forceSync || this._config.forceSync) {
    // Copy buffer over for syncing
    var writeBuffer = this._buffer;

    this._writeBuffer(this._buffer);

    // Clear buffer
    this._buffer = [];
  } 
};

// Refactor to 'storage module'
Tracker.prototype._writeBuffer = function (buffer) {
  var self = this,
      knexInstance = this._knex;

  // ToDo: Needs to be packed into a transaction

  function insertEvent(event) {
    return knexInstance('events').insert({
      uuid: event.uuid,
      resource_type: event.resource_type,
      event_name: event.event_name,
      start_date: event.start_date.toDate(),
      period: self._config.granularity,
      value: event.value
    });
  }

  function findEvent(event) {
    return knexInstance('events').where({
      uuid: event.uuid,
      resource_type: event.resource_type,
      event_name: event.event_name,
      start_date: event.start_date.toDate(),
      period: self._config.granularity
    }).first('value');
  }

  function updateEvent(event) {
    return knexInstance('events').where({
      uuid: event.uuid,
      resource_type: event.resource_type,
      event_name: event.event_name,
      start_date: event.start_date.toDate(),
      period: self._config.granularity
    }).increment('value', event.value);
  }

  // ToDo: Handle categories
  _.forEach(buffer, function (event) {
    findEvent(event).then(function (row) {
      if (!row) {
        return insertEvent(event);
      } else {
        return updateEvent(event);
      }
    });
  });
};

Tracker.prototype.fetch = function (options) {

};


function isSubEvent(name) {
  return _.indexOf(name, '.') !== -1;
}

function addTimestamp(object, granularity) {
  return _.extend(object, {
    start_date: moment().startOf(granularity)
  });
}

function migrateToLatest(knexInstance, config) {
  return knexInstance.migrate.latest(config);
}

module.exports = Tracker;
