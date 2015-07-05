import _ from 'lodash';
import moment from 'moment';

function isValidDate(date) {
  if (moment.isMoment(date)) {
    return date.isValid();
  } else {
    return moment(date).isValid();
  }
}

/*jshint unused:false*/
export default class Query {
  constructor(options) {
    this._defaults = {
      limit: 1,
      period: 'minute'
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
    if (!_.isNumber(num)) {
      throw new Error("Limit must be a number");
    }

    if (num < 1) {
      throw new Error("Limit must be greater or equal to one");
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

  fetch() {
    // Validate presence of:
    // event_name, resource_type, tracker_id
    return "12";
  }

  get definition() {
    return this._defaults;
  }

}