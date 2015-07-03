/*
 * spectre
 * http://spectre.is
 *
 * Copyright (c) 2015 Fabian Becker
 * Licensed under the MIT license.
 * https://github.com/spectre/spectre-tracker/blob/master/LICENSE-MIT
 */
'use strict';
import { EventEmitter } from 'events';
import _ from 'lodash';
import knex from 'knex';
import moment from 'moment';
import path from 'path';


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

export default class Tracker extends EventEmitter {
  constructor(config) {
    super();
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
        debug: false
      },
      forceSync: false
    };

    // Override defaults
    _.extend(this._config, config);
  }

  init() {
    this._knex = knex(this._config.database);
    return migrateToLatest(this._knex, {
      directory: path.join(__dirname, '../migrations')
    }).then(function () {
    });
  }

  track(uuid, resource_type, event_name, options) {
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

      // Clear buffer
      this._buffer = [];

      this._writeBuffer(writeBuffer);
    }
  }

  // Refactor to 'storage module'
  _writeBuffer(buffer) {
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
    buffer.forEach(event => {
      findEvent(event).then(row => {
        if (!row) {
          return insertEvent(event);
        } else {
          return updateEvent(event);
        }
      });
    });
  }

  query(options) {

  }
}
