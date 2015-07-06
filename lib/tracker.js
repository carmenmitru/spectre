/*
 * spectre
 * http://spectre.is
 *
 * Copyright (c) 2015 Fabian Becker
 * Licensed under the MIT license.
 * https://github.com/spectre/spectre-tracker/blob/master/LICENSE-MIT
 */
'use strict';
import events from 'events';
import _ from 'lodash';
import knex from 'knex';
import moment from 'moment';
import path from 'path';
import Promise from 'bluebird';
import Query from './query';

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

export default class Tracker extends events.EventEmitter {
  constructor(trackerName, config) {
    super();

    if (!trackerName || !_.isString(trackerName)) {
      throw new Error("Missing tracker name");
    }

    this._buffer = [];

    this._trackerName = trackerName;

    // Move granularity, processedPeriods and retention into
    // tracker.data (json blob)
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

      // Read from config? Take knex instance as param?
      database: {
        client: 'sqlite3',
        connection: {
          filename: path.join(__dirname, '../development.sqlite3')
        },
        debug: false
      },

      // Only used for testing
      forceSync: false
    };

    // Override defaults
    _.extend(this._config, config);
  }


  /**
   * Initialises database connection and
   * fetches tracker id.
   *
   * @returns {Promise}
   */
  init() {
    this._knex = knex(this._config.database);

    // Not pretty
    return migrateToLatest(this._knex, {
      directory: path.join(__dirname, '../migrations')
    }).then(() => {
      return this._knex('trackers').where({
        name: this._trackerName
      }).first('id'); // Returns object
    }).then(tracker => {
      if (!tracker) {
        return this._knex('trackers').insert({
          name: this._trackerName
        }, 'id');
      }
      return tracker.id;
    }).then(id => {
      if (_.isArray(id)) {
        this._trackerId = id[0];
      } else {
        this._trackerId = id;
      }
    }).catch(function(error) {
      console.error(error);
    });
  }

  /**
   * Tracks a new event
   *
   * @public
   * @param {string} A unique identifier for the resource_type
   * @param {string} Resource type of the event (e.g. post)
   * @param {string} Name of the event (e.g. visit)
   * @param {{}} A set of options
   * @returns {Promise} Resolves when the event was correctly tracked
   */
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

        // We only track the category for the deepest level
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

  /**
   * Writes buffer to database.
   *
   * @todo Refactor to storage module
   * @param The current event buffer
   * @returns {Promise}
   */
  _writeBuffer(buffer) {
    var self = this,
        knexInstance = this._knex;

    function insertEvent(event) {
      return knexInstance('events').insert({
        uuid: event.uuid,
        tracker_id: self.trackerId,
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
        tracker_id: self.trackerId,
        resource_type: event.resource_type,
        event_name: event.event_name,
        start_date: event.start_date.toDate(),
        period: self._config.granularity
      }).first('value');
    }

    function updateEvent(event) {
      return knexInstance('events').where({
        uuid: event.uuid,
        tracker_id: self.trackerId,
        resource_type: event.resource_type,
        event_name: event.event_name,
        start_date: event.start_date.toDate(),
        period: self._config.granularity
      }).increment('value', event.value);
    }

    var p = Promise.resolve();
    // ToDo: Handle categories
    buffer.forEach(event => {
      p = p.then(findEvent(event).then(row => {
        if (!row) {
          return insertEvent(event);
        } else {
          return updateEvent(event);
        }
      }));
    });

    return p;
  }

  /**
   * Query interface
   *
   * @param {{}} An object with query options
   * @returns
   */
  query(options) {
    let opts = _.extend(options, { tracker_id: this.trackerId });
    return new Query(this._knex, opts);
  }

  get trackerName() {
    return this._trackerName;
  }

  get trackerId() {
    return this._trackerId;
  }
}
