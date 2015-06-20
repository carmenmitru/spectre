var Tracker = require('../lib/tracker');
t = new Tracker();

// Count a generic visit to a post with uuid 'abc'
t.track('abc', 'post', 'visit');

// Count a visit from twitter to a post with uuid 'abc'
// This increments the visit counter and the visit.social counter as
// well as the counter for the category/value.
t.track('abc', 'post', 'visit.social', { value: 'twitter' });

// Count a hit from a referrer
t.track('abc', 'post', 'referrer', { value: 'http://google.com' });

// Track when a logged in user visits a post
// ToDo: Define how to query posts that have a visit by a userid
t.track('abc', 'post', 'user.visit', { value: 'userid' });



