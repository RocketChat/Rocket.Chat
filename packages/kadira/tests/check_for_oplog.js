if(typeof Minimongo == 'undefined') {
  return;
}

Tinytest.add(
  'CheckForOplog - OplogCheck._070 - no limit supported',
  function (test) {
    test.equal(OplogCheck._070({
      options: {limit: 20}
    }).code, '070_LIMIT_NOT_SUPPORTED');
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck._070 - $ operators',
  function (test) {
    test.equal(OplogCheck._070({
      options: {},
      selector: {$and: {}}
    }).code, '070_$_NOT_SUPPORTED');
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck._070 - not scaler values',
  function (test) {
    test.equal(OplogCheck._070({
      options: {},
      selector: {aa: {$gt: 20}}
    }).code, '070_ONLY_SCALERS');
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck._070 - support oplog',
  function (test) {
    test.equal(OplogCheck._070({
      options: {},
      selector: {}
    }), true);
  }
);


Tinytest.add(
  'CheckForOplog - OplogCheck._071 - no limit supported',
  function (test) {
    test.equal(OplogCheck._071({
      options: {limit: 20}
    }).code, '071_LIMIT_NOT_SUPPORTED');
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck._071 - supports oplog',
  function (test) {
    test.equal(OplogCheck._071({
      options: {},
      selector: {aa: {$gt: 20}}
    }), true);
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.env - MONGO_OPLOG_URL exists',
  function (test) {
    WithMongoOplogUrl(function() {
      test.equal(OplogCheck.env(), true);
    });
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.env - MONGO_OPLOG_URL doesnot exists',
  function (test) {
    test.equal(OplogCheck.env().code, 'NO_ENV');
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.disableOplog - without _disableOplog',
  function (test) {
    test.equal(OplogCheck.disableOplog({options: {}}), true);
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.disableOplog - with _disableOplog',
  function (test) {
    var result = OplogCheck.disableOplog({options: {_disableOplog: true}});
    test.equal(result.code, 'DISABLE_OPLOG');
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.miniMongoMatcher - with correct selector',
  function (test) {
    test.equal(OplogCheck.miniMongoMatcher({
      options: {},
      selector: {aa: 10}
    }), true);
  }
);

// for older versions. We don't need to break apps
Tinytest.add(
  'CheckForOplog - OplogCheck.miniMongoMatcher - no MiniMongo.Matcher',
  function (test) {
    var originalMiniMongoMatcher = Minimongo.Matcher;
    Minimongo.Matcher = null;
    test.equal(OplogCheck.miniMongoMatcher({
      options: {},
      // if there was Minimongo.Matcher, this should've trigger an error
      selector: {aa: {$in: null}}
    }), true);
    Minimongo.Matcher = originalMiniMongoMatcher;
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.miniMongoMatcher - with incorrect selector',
  function (test) {
    var result = OplogCheck.miniMongoMatcher({
      options: {},
      selector: {aa: {$in: null}}
    });
    test.equal(result.code, 'MINIMONGO_MATCHER_ERROR');
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.fields - without any fields',
  function (test) {
    test.equal(OplogCheck.fields({options: {}}), true);
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.fields - with valid fields',
  function (test) {
    test.equal(OplogCheck.fields({options: {
      fields: {aa: 0}
    }}), true);
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.fields - with invalid fields',
  function (test) {
    test.equal(OplogCheck.fields({options: {
      fields: {$elemMatch: {aa: 10}}
    }}).code, "NOT_SUPPORTED_FIELDS");
  }
);


Tinytest.add(
  'CheckForOplog - OplogCheck.skip - with having skip',
  function (test) {
    test.equal(OplogCheck.skip({options: {
      skip: 10
    }}).code, "SKIP_NOT_SUPPORTED");
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.skip - no skip',
  function (test) {
    test.equal(OplogCheck.skip({options: {

    }}), true);
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.where - with having where',
  function (test) {
    test.equal(OplogCheck.where({selector: {
      $where: function() {}
    }}).code, "WHERE_NOT_SUPPORTED");
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.where - without having where',
  function (test) {
    test.equal(OplogCheck.where({selector: {

    }}), true);
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.geo - with having geo',
  function (test) {
    test.equal(OplogCheck.geo({selector: {
      loc: {$near: [50, 50]}
    }}).code, "GEO_NOT_SUPPORTED");
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.geo - without having geo operators',
  function (test) {
    test.equal(OplogCheck.geo({selector: {

    }}), true);
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.limitButNoSort - limit without sort',
  function (test) {
    test.equal(OplogCheck.limitButNoSort({options: {
      limit: 20
    }}).code, "LIMIT_NO_SORT");
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.limitButNoSort - limit with sort',
  function (test) {
    test.equal(OplogCheck.limitButNoSort({options: {
      limit: 20,
      sort: {aa: 1}
    }}), true);
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.miniMongoSorter - supported sort specifier',
  function (test) {
    var result = OplogCheck.miniMongoSorter({options: {
      sort: {aa: 1}
    }});
    test.equal(result, true);
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.miniMongoSorter - unsupported sort specifier',
  function (test) {
    var result = OplogCheck.miniMongoSorter({options: {
      sort: {$natural: 1}
    }});
    test.equal(result.code, "MINIMONGO_SORTER_ERROR");
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.olderVersion - older version',
  function (test) {
    var driver = function() {};
    test.equal(OplogCheck.olderVersion(null, driver).code, "OLDER_VERSION");
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.olderVersion - newer version',
  function (test) {
    function Observer() {};
    Observer.cursorSupported = function() {}

    var driver = new Observer();
    test.equal(OplogCheck.olderVersion(null, driver), true);
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.gitCheckout - meteor version',
  function (test) {
    test.equal(OplogCheck.gitCheckout(), true);
  }
);

Tinytest.add(
  'CheckForOplog - OplogCheck.gitCheckout - cloned from git',
  function (test) {
    var originalRelease = Meteor.release;
    Meteor.release = null;
    test.equal(OplogCheck.gitCheckout().code, 'GIT_CHECKOUT');
    Meteor.release = originalRelease;
  }
);

Tinytest.addAsync(
  'CheckForOplog - Kadira.checkWhyNoOplog - version 0.7.0',
  function (test, done) {
    var originalRelease = Meteor.release;
    Meteor.release = "0.7.0.1";

    WithMongoOplogUrl(function() {
      var result = Kadira.checkWhyNoOplog({
        selector: {aa: {$gt: 20}},
        options: {}
      });
      test.equal(result.code, '070_ONLY_SCALERS');
      done();
    });

    Meteor.release = originalRelease;
  }
);

Tinytest.addAsync(
  'CheckForOplog - Kadira.checkWhyNoOplog - version 0.7.1',
  function (test, done) {
    var originalRelease = Meteor.release;
    Meteor.release = "0.7.1";

    WithMongoOplogUrl(function () {
      var result = Kadira.checkWhyNoOplog({
        selector: {aa: {$gt: 20}},
        options: {limit: 20}
      });
      test.equal(result.code, '071_LIMIT_NOT_SUPPORTED');
      done();
    });

    Meteor.release = originalRelease;
  }
);

Tinytest.add(
  'CheckForOplog - Kadira.checkWhyNoOplog - no env',
  function (test) {

    var result = Kadira.checkWhyNoOplog({
      selector: {aa: {$gt: 20}},
      options: {limit: 20},
    });
    test.equal(result.code, 'NO_ENV');
  }
);

Tinytest.addAsync(
  'CheckForOplog - Kadira.checkWhyNoOplog - limitNoSort',
  function (test, done) {

    WithMongoOplogUrl(function() {
      var result = Kadira.checkWhyNoOplog({
        selector: {aa: {$gt: 20}},
        options: {limit: 20},
      });
      test.equal(result.code, 'LIMIT_NO_SORT');
      done();
    });
  }
);

Tinytest.addAsync(
  'CheckForOplog - Kadira.checkWhyNoOplog - supportting query',
  function (test, done) {
    function Observer() {};
    Observer.cursorSupported = function() {}
    var driver = new Observer();

    WithMongoOplogUrl(function() {
      var result = Kadira.checkWhyNoOplog({
        selector: {aa: {$gt: 20}},
        options: {limit: 20, sort: {aa: 1}},
      }, driver);
      test.equal(result.code, 'OPLOG_SUPPORTED');
      done();
    });
  }
);

Tinytest.addAsync(
  'CheckForOplog - Kadira.checkWhyNoOplog - with invalid MiniMongo.Matcher',
  function (test, done) {
    var originalRelease = Meteor.release;
    Meteor.release = "0.7.1";

    WithMongoOplogUrl(function () {
      var result = Kadira.checkWhyNoOplog({
        selector: {aa: {$in: null}},
        options: {limit: 20}
      });
      test.equal(result.code, 'MINIMONGO_MATCHER_ERROR');
      done();
    });

    Meteor.release = originalRelease;
  }
);


function WithMongoOplogUrl(fn) {
  process.env.MONGO_OPLOG_URL="mongodb://ssdsd";
  fn();
  delete process.env.MONGO_OPLOG_URL;
}
