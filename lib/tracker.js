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
    util         = require('util');

function Tracker() {
  EventEmitter.call(this);

  // ToDo: Make sure database connection is valid
  this.buffer = [];

}

util.inherits(Tracker, EventEmitter);

Tracker.prototype.track = function (uuid, resource_type, event_name, options) {
  var self = this;
  
  if (!uuid || !resource_type || !event_name) {
    throw new Error('Missing arguments');
  }

  if (_.isUndefined(options)) {
    options = {};
  }

  function storeEvent(uuid, resource_type, event_name, options) {
    var document = { uuid: uuid, resource_type: resource_type, event_name: event_name },
        data = _.findWhere(self.buffer, document),
        category;

    // Push document if it doesn't exist
    if (_.isUndefined(data)) {
      data = _.extend(document, { value: 0, categories: [] });
      self.buffer.push(data);
    }

    // Always count the event
    data.value = data.value + 1;

    // Now count the category
    if (options.category) {
      category = _.findWhere(data.categories, { name: options.category });

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
};

Tracker.prototype.fetch = function (options) {

};

Tracker.prototype.dumpBuffer = function () { return this.buffer; };


function isSubEvent(name) {
  return _.indexOf(name, '.') !== -1;
}

module.exports = Tracker;
