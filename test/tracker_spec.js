var sinon   = require('sinon'),
    should  = require('should'),
    Tracker = require('../lib/tracker');

describe('Tracker', function(){

    describe('#track', function () {
        var tracker;

        beforeEach(function () {
            tracker = new Tracker();
        });

        it('should emit event when called', function () {
            var spy = sinon.spy();

            tracker.on('new visit', spy);
            tracker.track();

            spy.called.should.be.true;
        });
    })
})

