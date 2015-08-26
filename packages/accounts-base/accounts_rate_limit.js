var Ap = AccountsCommon.prototype;
var defaultRateLimiterRuleId;
// Removes default rate limiting rule
Ap.removeDefaultRateLimit = function () {
  const resp = DDPRateLimiter.removeRule(defaultRateLimiterRuleId);
  defaultRateLimiterRuleId = null;
  return resp;
}

// Add a default rule of limiting logins, creating new users and password reset
// to 5 times every 10 seconds per connection.
Ap.addDefaultRateLimit = function () {
  if (!defaultRateLimiterRuleId) {
    defaultRateLimiterRuleId = DDPRateLimiter.addRule({
      userId: null,
      clientAddress: null,
      type: 'method',
      name: function (name) {
        return _.contains(['login', 'createUser', 'resetPassword',
          'forgotPassword'], name);
      },
      connectionId: function (connectionId) {
        return true;
      }
    }, 5, 10000);
  }
}

Ap.addDefaultRateLimit();