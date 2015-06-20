var sinon   = require('sinon'),
    should  = require('should'),
    uuid    = require('node-uuid'),
    Tracker = require('../lib/tracker');

/*global describe, it, before, beforeEach, after, afterEach */
describe('Tracker', function () {

  describe('#track', function () {
    var tracker;

    beforeEach(function () {
      tracker = new Tracker();
    });

    it('emits event when called', function () {
      var spy = sinon.spy();

      tracker.on('post.visit', spy);
      tracker.track(
          uuid.v4(),
          'post',
          'visit'
      );

      spy.called.should.be.true;
    });

    it('emits uuid/options when called', function (done) {
      var uid = uuid.v4();

      tracker.on('post.visit', function (data) {
        data.uuid.should.equal(uid);
        done();
      });

      tracker.track(
          uid,
          'post',
          'visit'
      );
    });

    it('emits events for all subevents', function () {
      var spy = sinon.spy();

      tracker.on('post.visit', spy);
      tracker.on('post.visit.social', spy);
      tracker.track(
          uuid.v4(),
          'post',
          'visit.social'
      );

      spy.calledTwice.should.be.true;
    });

    it('errors if arguments are missing', function () {
      var missingResourceType = function () {
            tracker.track(uuid.v4());
          },
          missingEventName = function () {
            tracker.track(uuid.v4(), 'post');
          };

      // Missing resource_type and event_name
      missingResourceType.should.throwError('Missing arguments');
      missingEventName.should.throwError('Missing arguments');
    });
  });

  describe("#query", function () {

  });
});

