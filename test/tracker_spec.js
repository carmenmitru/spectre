var sinon   = require('sinon'),
    should  = require('should'),
    uuid    = require('node-uuid'),
    Tracker = require('../lib/tracker');

// To stop jshint complaining
should.equal(true, true);

/*global describe, it, beforeEach */
describe('Tracker', function () {
  describe('#constructor', function() {
    it('takes a config object', function() {
      var config = {
        forceSync: true
      };
      var tracker = new Tracker(config);

      should.equal(tracker._config.forceSync, true);
    });
  });

  describe('#track', function () {
    var tracker;

    beforeEach(function (done) {
      tracker = new Tracker();
      tracker.init().then(done);
    });

    it('emits event when called', function () {
      var spy = sinon.spy();

      tracker.on('post.visit', spy);
      tracker.track(
          uuid.v4(),
          'post',
          'visit'
      );

      spy.called.should.equal(true);
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

      spy.calledTwice.should.equal(true);
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

    it('writes buffer when forceSync is passed', function() {
      var spy = sinon.spy(tracker, '_writeBuffer');

      tracker.track(uuid.v4(), 'post', 'visit', { forceSync: true });
      spy.called.should.equal(true);
    });
  });
});

