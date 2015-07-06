import should from 'should';
import uuid from 'node-uuid';
import Query from '../lib/query';

/*jshint expr:true*/
// To stop jshint complaining
should.equal(true, true);

/*global describe, it, before, beforeEach */
describe('Query', function () {
  var query;

  beforeEach(function() {
    query = new Query({}, { tracker_id: 1 });
  });

  describe('#constructor', function() {
    it('sets default limit', function() {
      should.equal(query.definition.limit, 1);
    });

    it('sets default period', function() {
      should.equal(query.definition.period, 'minute');
    });

    it('sets empty include', function() {
      query.definition.include.should.be.an.Array;
    });
  });

  describe('#period', function() {
    it('allows chaining', function() {
      query.period('minute').should.be.instanceOf(Query);
    });

    it('sets period if valid', function() {
      should.equal(query.period('year').definition.period, 'year');
    });
  });

  describe('#event', function() {
    it('allows chaining', function() {
      query.event('visit').should.be.instanceOf(Query);
    });

    it('sets event if valid', function() {
      should.equal(query.event('click').definition.event_name, 'click');
    });
  });

  describe('#resource', function() {
    it('allows chaining', function() {
      query.resource('post').should.be.instanceOf(Query);
    });

    it('sets resource if valid', function() {
      should.equal(query.resource('article').definition.resource_type, 'article');
    });
  });

  describe('#limit', function() {
    it('allows chaining', function() {
      query.limit(12).should.be.instanceOf(Query);
    });

    it('sets limit if valid', function() {
      should.equal(query.limit(100).definition.limit, 100);
    });

    it('throws error on invalid limit (numeric)', function() {
      var invalidNumericLimit = function () {
        query.limit(0);
      };

      invalidNumericLimit.should.throwError("Limit must be greater or equal to one");
    });

    it('throws error on invalid limit (string)', function() {
      var invalidLimit = function () {
        query.limit('not a valid limit');
      };

      invalidLimit.should.throwError("Limit must be an integer");
    });

    it('throws error on invalid limit (float)', function() {
      var invalidLimit = function () {
        query.limit(3.14);
      };

      invalidLimit.should.throwError("Limit must be an integer");
    });
  });

  describe('#uuid', function() {
    it('allows chaining', function() {
      query.uuid(uuid.v4()).should.be.instanceOf(Query);
    });

    it('sets uuid if valid', function() {
      var id = uuid.v4();
      should.equal(query.uuid(id).definition.uuid, id);
    });
  });

  describe('#before', function() {
    it('allows chaining', function() {
      query.before(new Date()).should.be.instanceOf(Query);
    });

    it('sets before_date if valid', function() {
      var date = new Date(2014, 1, 1);

      should.equal(query.before(date).definition.end_date, date);
    });

    it('throws an error when invalid before_date passed', function() {
      var invalidBeforeDate = function() {
        query.before('invalid');
      };

      invalidBeforeDate.should.throwError('Invalid date passed');
    });
  });

  describe('#after', function() {
    it('allows chaining', function() {
      query.after(new Date()).should.be.instanceOf(Query);
    });

    it('sets after_date if valid', function() {
      var date = new Date(1990, 11, 29);

      should.equal(query.after(date).definition.start_date, date);
    });

    it('throws an error when invalid after_date passed', function() {
      var invalidAfterDate = function() {
        query.after('invalid');
      };

      invalidAfterDate.should.throwError('Invalid date passed');
    });
  });

  describe('#between', function() {
    var beforeDate, afterDate;

    before(function() {
      afterDate = new Date(2015, 1, 1);
      beforeDate = new Date(2015, 7, 4);
    });

    it('allows chaining', function() {
      query.between(new Date(), new Date()).should.be.instanceOf(Query);
    });

    it('sets before_date and after_date if valid', function() {
      query.between(afterDate, beforeDate);

      should.equal(query.definition.start_date, afterDate);
      should.equal(query.definition.end_date, beforeDate);
    });

    it('throws an error when invalid before_date passed', function() {
      var invalidBeforeDate = function() {
        query.between(afterDate, 'invalid');
      };

      invalidBeforeDate.should.throwError('Invalid date passed');
    });

    it('throws an error when invalid after_date passed', function() {
      var invalidAfterDate = function() {
        query.between('invalid', beforeDate);
      };

      invalidAfterDate.should.throwError('Invalid date passed');
    });
  });

  describe('#include', function() {
    it('allows chaining', function() {
      query.include('visit.referrer').should.be.instanceOf(Query);
    });

    it('adds event to definition', function() {
      let eventName = 'visit.referrer';

      query.include(eventName);
      query.definition.include.should.containEql(eventName);
    });
  });

  describe('#fetch', function() {
    // Integration test
    // it('returns an array', function() {
    //   query.resource('post').event('visit').uuid(uuid.v4());
    //   query.fetch().should.be.an.Array;
    // });

    it('throws an error if keys are missing', function() {
      var invalidQuery = function () {
        query.fetch();
      };

      invalidQuery.should.throwError('Incomplete query');
    });
  });

  describe('#definition', function() {
    it('returns an object', function() {
      query.definition.should.be.an.Object;
    });
  });
});

