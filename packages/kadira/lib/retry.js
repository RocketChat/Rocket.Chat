// Retry logic with an exponential backoff.
//
// options:
//  baseTimeout: time for initial reconnect attempt (ms).
//  exponent: exponential factor to increase timeout each attempt.
//  maxTimeout: maximum time between retries (ms).
//  minCount: how many times to reconnect "instantly".
//  minTimeout: time to wait for the first `minCount` retries (ms).
//  fuzz: factor to randomize retry times by (to avoid retry storms).

//TODO: remove this class and use Meteor Retry in a later version of meteor.

Retry = function (options) {
  var self = this;
  _.extend(self, _.defaults(_.clone(options || {}), {
    baseTimeout: 1000, // 1 second
    exponent: 2.2,
    // The default is high-ish to ensure a server can recover from a
    // failure caused by load.
    maxTimeout: 5 * 60000, // 5 minutes
    minTimeout: 10,
    minCount: 2,
    fuzz: 0.5 // +- 25%
  }));
  self.retryTimer = null;
};

_.extend(Retry.prototype, {

  // Reset a pending retry, if any.
  clear: function () {
    var self = this;
    if(self.retryTimer)
      clearTimeout(self.retryTimer);
    self.retryTimer = null;
  },

  // Calculate how long to wait in milliseconds to retry, based on the
  // `count` of which retry this is.
  _timeout: function (count) {
    var self = this;

    if(count < self.minCount)
      return self.minTimeout;

    var timeout = Math.min(
      self.maxTimeout,
      self.baseTimeout * Math.pow(self.exponent, count));
    // fuzz the timeout randomly, to avoid reconnect storms when a
    // server goes down.
    timeout = timeout * ((Random.fraction() * self.fuzz) +
                         (1 - self.fuzz/2));
    return Math.ceil(timeout);
  },

  // Call `fn` after a delay, based on the `count` of which retry this is.
  retryLater: function (count, fn) {
    var self = this;
    var timeout = self._timeout(count);
    if(self.retryTimer)
      clearTimeout(self.retryTimer);

    self.retryTimer = setTimeout(fn, timeout);
    return timeout;
  }

});
