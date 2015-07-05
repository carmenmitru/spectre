import should from 'should';
import uuid from 'node-uuid';
import Query from '../lib/query';

// To stop jshint complaining
should.equal(true, true);

/*global describe, it, beforeEach */
describe('Query', function () {
  var query;

  beforeEach(function() {
    query = new Query();
  });

  describe('#constructor', function() {
    it('sets default limit', function() {
      should.equal(query.definition.limit, 1);
    });

    it('sets default period', function() {
      should.equal(query.definition.period, 'minute');
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
  });

  describe('#after', function() {
    it('allows chaining', function() {
      query.after(new Date()).should.be.instanceOf(Query);
    });

    it('sets after_date if valid', function() {
      var date = new Date(1990, 11, 29);

      should.equal(query.after(date).definition.start_date, date);
    });
  });

  describe('#between', function() {
    it('allows chaining', function() {
      query.between(new Date(), new Date()).should.be.instanceOf(Query);
    });

    it('sets before_date and after_date if valid', function() {
      var afterDate = new Date(2015, 1, 1),
          beforeDate = new Date(2015, 7, 4);

      query.between(afterDate, beforeDate);

      should.equal(query.definition.start_date, afterDate);
      should.equal(query.definition.end_date, beforeDate);
    });
  });
});

