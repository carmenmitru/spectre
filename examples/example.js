var Tracker = require('../lib/tracker');
t = new Tracker();

// Count a generic visit to a post with uuid 'abc'
t.track('abc', 'post', 'visit');

// Count a visit from twitter to a post with uuid 'abc'
// This increments the visit counter and the visit.social counter as
// well as the counter for the category.
t.track('abc', 'post', 'visit.social', { category: 'twitter' });

// Count a hit from a referrer
t.track('abc', 'post', 'referrer', { category: 'http://google.com' });



