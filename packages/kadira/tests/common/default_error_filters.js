Tinytest.add(
  'Default Error Filters - filterValidationErrors - filtered',
  function (test) {
    var err = new Meteor.Error('hello');
    var validated = Kadira.errorFilters.filterValidationErrors(null, null, err);
    test.equal(validated, false);
  }
);

Tinytest.add(
  'Default Error Filters - filterValidationErrors - not filtered',
  function (test) {
    var err = new Error('hello');
    var validated = Kadira.errorFilters.filterValidationErrors(null, null, err);
    test.equal(validated, true);
  }
);

Tinytest.add(
  'Default Error Filters - filterCommonMeteorErrors - not filtered',
  function (test) {
    var message = "this is something else"
    var validated = Kadira.errorFilters.filterValidationErrors(null, message);
    test.equal(validated, true);
  }
);

Tinytest.add(
  'Default Error Filters - filterCommonMeteorErrors - ddp heartbeats',
  function (test) {
    var message = "Connection timeout. No DDP heartbeat received.";
    var validated = Kadira.errorFilters.filterCommonMeteorErrors(null, message);
    test.equal(validated, false);
  }
);

Tinytest.add(
  'Default Error Filters - filterCommonMeteorErrors - sockjs heartbeats',
  function (test) {
    var message = "Connection timeout. No sockjs heartbeat received.";
    var validated = Kadira.errorFilters.filterCommonMeteorErrors(null, message);
    test.equal(validated, false);
  }
);

Tinytest.add(
  'Default Error Filters - filterCommonMeteorErrors - sockjs invalid state',
  function (test) {
    var message = "INVALID_STATE_ERR";
    var validated = Kadira.errorFilters.filterCommonMeteorErrors(null, message);
    test.equal(validated, false);
  }
);