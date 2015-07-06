import _ from 'lodash';
import moment from 'moment';

/**
 * Validates a date
 *
 * @param date
 * @returns {boolean}
 */
function isValidDate(date) {
  if (moment.isMoment(date)) {
    return date.isValid();
  } else {
    return moment(date).isValid();
  }
}

/**
 * Checks for required keys to execute a query
 *
 * @param {definition} Query definition
 * @returns {boolean}
 */
function isValidQuery(definition) {
  var requiredKeys = [
    'event_name',
    'resource_type',
    'tracker_id'
  ];

  return _.all(requiredKeys, function(key) {
    return _.has(definition, key);
  });
}

/*jshint unused:true*/
export default class Query {
  constructor(knex, options) {
    this._knex = knex;

    this._defaults = {
      limit: 1,
      period: 'minute',
      include: []
    };

    _.extend(this._defaults, options);
  }

  resource(name) {
    this._defaults.resource_type = name;

    return this;
  }

  event(name) {
    this._defaults.event_name = name;

    return this;
  }

  limit(num) {
    if (!_.isNumber(num) || !Number.isInteger(num)) {
      throw new Error('Limit must be an integer');
    }

    if (num < 1) {
      throw new Error('Limit must be greater or equal to one');
    }

    this._defaults.limit = num;

    return this;
  }

  period(name) {
    var allowedPeriods = [
      'year', 'month', 'week',
      'day', 'hour', 'minute'
    ];
    // Validate allowed periods
    if (!_.includes(allowedPeriods, name)) {
      throw new Error('Invalid period');
    }

    this._defaults.period = name;

    return this;
  }

  between(start, end) {
    if(!isValidDate(start) || !isValidDate(end)) {
      throw new Error('Invalid date passed');
    }

    this._defaults.start_date = start;
    this._defaults.end_date = end;

    return this;
  }

  after(date) {
    // Validate date format
    if(!isValidDate(date)) {
      throw new Error('Invalid date passed');
    }
    this._defaults.start_date = date;

    return this;
  }

  before(date) {
    // Validate date format
    if(!isValidDate(date)) {
      throw new Error('Invalid date passed');
    }
    this._defaults.end_date = date;

    return this;
  }

  uuid(id) {
    this._defaults.uuid = id;

    return this;
  }

  orderBy(options) {
    this._defaults.order = options;

    return this;
  }

  /**
   * Adds an event to the query list
   *
   * @param {String} Name of an Event
   * @returns {Query}
   */
  include(name) {
    this._defaults.include.push(name);

    return this;
  }

  /**
   * Fetches events based on a query definition.
   *
   * @returns {Array} List of events
   */
  fetch() {
    if (!isValidQuery(this._defaults)) {
      // This could be more intelligent
      throw new Error('Incomplete query');
    }

    let knex = this._knex;
    let opts = this._defaults;
    let query = knex.select().from('events');

    if (opts.period) {
      query.where({ period: opts.period });
    }

    query.where({
      event_name: opts.event_name,
      resource_type: opts.resource_type,
      tracker_id: opts.tracker_id
    });

    // Always apply limit
    query.limit(opts.limit);

    // Needs to groupBy uuid if no uuid specified

    return query.then(result => {
      return JSON.stringify(result);
    });
  }

  get definition() {
    return this._defaults;
  }

}