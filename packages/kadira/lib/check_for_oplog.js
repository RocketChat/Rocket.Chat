// expose for testing purpose
OplogCheck = {};

OplogCheck._070 = function(cursorDescription) {
  var options = cursorDescription.options;
  if (options.limit) {
    return {
      code: "070_LIMIT_NOT_SUPPORTED",
      reason: "Meteor 0.7.0 does not support limit with oplog.",
      solution: "Upgrade your app to Meteor version 0.7.2 or later."
    }
  };

  var exists$ = _.any(cursorDescription.selector, function (value, field) {
    if (field.substr(0, 1) === '$')
      return true;
  });

  if(exists$) {
    return {
      code: "070_$_NOT_SUPPORTED",
      reason: "Meteor 0.7.0 supports only equal checks with oplog.",
      solution: "Upgrade your app to Meteor version 0.7.2 or later."
    }
  };

  var onlyScalers = _.all(cursorDescription.selector, function (value, field) {
    return typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value === null ||
      value instanceof Meteor.Collection.ObjectID;
  });

  if(!onlyScalers) {
    return {
      code: "070_ONLY_SCALERS",
      reason: "Meteor 0.7.0 only supports scalers as comparators.",
      solution: "Upgrade your app to Meteor version 0.7.2 or later."
    }
  }

  return true;
};

OplogCheck._071 = function(cursorDescription) {
  var options = cursorDescription.options;
  var matcher = new Minimongo.Matcher(cursorDescription.selector);
  if (options.limit) {
    return {
      code: "071_LIMIT_NOT_SUPPORTED",
      reason: "Meteor 0.7.1 does not support limit with oplog.",
      solution: "Upgrade your app to Meteor version 0.7.2 or later."
    }
  };

  return true;
};


OplogCheck.env = function() {
  if(!process.env.MONGO_OPLOG_URL) {
    return {
      code: "NO_ENV",
      reason: "You haven't added oplog support for your the Meteor app.",
      solution: "Add oplog support for your Meteor app. see: http://goo.gl/Co1jJc"
    }
  } else {
    return true;
  }
};

OplogCheck.disableOplog = function(cursorDescription) {
  if(cursorDescription.options._disableOplog) {
    return {
      code: "DISABLE_OPLOG",
      reason: "You've disable oplog for this cursor explicitly with _disableOplog option."
    };
  } else {
    return true;
  }
};

// when creating Minimongo.Matcher object, if that's throws an exception
// meteor won't do the oplog support
OplogCheck.miniMongoMatcher = function(cursorDescription) {
  if(Minimongo.Matcher) {
    try {
      var matcher = new Minimongo.Matcher(cursorDescription.selector);
      return true;
    } catch(ex) {
      return {
        code: "MINIMONGO_MATCHER_ERROR",
        reason: "There's something wrong in your mongo query: " +  ex.message,
        solution: "Check your selector and change it accordingly."
      };
    }
  } else {
    // If there is no Minimongo.Matcher, we don't need to check this
    return true;
  }
};

OplogCheck.miniMongoSorter = function(cursorDescription) {
  var matcher = new Minimongo.Matcher(cursorDescription.selector);
  if(Minimongo.Sorter && cursorDescription.options.sort) {
    try {
      var sorter = new Minimongo.Sorter(
        cursorDescription.options.sort,
        { matcher: matcher }
      );
      return true;
    } catch(ex) {
      return {
        code: "MINIMONGO_SORTER_ERROR",
        reason: "Some of your sort specifiers are not supported: " + ex.message,
        solution: "Check your sort specifiers and chage them accordingly."
      }
    }
  } else {
    return true;
  }
};

OplogCheck.fields = function(cursorDescription) {
  var options = cursorDescription.options;
  if(options.fields) {
    try {
      LocalCollection._checkSupportedProjection(options.fields);
      return true;
    } catch (e) {
      if (e.name === "MinimongoError") {
        return {
          code: "NOT_SUPPORTED_FIELDS",
          reason: "Some of the field filters are not supported: " + e.message,
          solution: "Try removing those field filters."
        };
      } else {
        throw e;
      }
    }
  }
  return true;
};

OplogCheck.skip = function(cursorDescription) {
  if(cursorDescription.options.skip) {
    return {
      code: "SKIP_NOT_SUPPORTED",
      reason: "Skip does not support with oplog.",
      solution: "Try to avoid using skip. Use range queries instead: http://goo.gl/b522Av"
    };
  }

  return true;
};

OplogCheck.where = function(cursorDescription) {
  var matcher = new Minimongo.Matcher(cursorDescription.selector);
  if(matcher.hasWhere()) {
    return {
      code: "WHERE_NOT_SUPPORTED",
      reason: "Meteor does not support queries with $where.",
      solution: "Try to remove $where from your query. Use some alternative."
    }
  };

  return true;
};

OplogCheck.geo = function(cursorDescription) {
  var matcher = new Minimongo.Matcher(cursorDescription.selector);

  if(matcher.hasGeoQuery()) {
    return {
      code: "GEO_NOT_SUPPORTED",
      reason: "Meteor does not support queries with geo partial operators.",
      solution: "Try to remove geo partial operators from your query if possible."
    }
  };

  return true;
};

OplogCheck.limitButNoSort = function(cursorDescription) {
  var options = cursorDescription.options;

  if((options.limit && !options.sort)) {
    return {
      code: "LIMIT_NO_SORT",
      reason: "Meteor oplog implementation does not support limit without a sort specifier.",
      solution: "Try adding a sort specifier."
    }
  };

  return true;
};

OplogCheck.olderVersion = function(cursorDescription, driver) {
  if(driver && !driver.constructor.cursorSupported) {
    return {
      code: "OLDER_VERSION",
      reason: "Your Meteor version does not have oplog support.",
      solution: "Upgrade your app to Meteor version 0.7.2 or later."
    };
  }
  return true;
};

OplogCheck.gitCheckout = function(cursorDescription, driver) {
  if(!Meteor.release) {
    return {
      code: "GIT_CHECKOUT",
      reason: "Seems like your Meteor version is based on a Git checkout and it doesn't have the oplog support.",
      solution: "Try to upgrade your Meteor version."
    };
  }
  return true;
};

var preRunningMatchers = [
  OplogCheck.env,
  OplogCheck.disableOplog,
  OplogCheck.miniMongoMatcher
];

var globalMatchers = [
  OplogCheck.fields,
  OplogCheck.skip,
  OplogCheck.where,
  OplogCheck.geo,
  OplogCheck.limitButNoSort,
  OplogCheck.miniMongoSorter,
  OplogCheck.olderVersion,
  OplogCheck.gitCheckout
];

var versionMatchers = [
  [/^0\.7\.1/, OplogCheck._071],
  [/^0\.7\.0/, OplogCheck._070],
];

Kadira.checkWhyNoOplog = function(cursorDescription, observerDriver) {
  if(typeof Minimongo == 'undefined') {
    return {
      code: "CANNOT_DETECT",
      reason: "You are running an older Meteor version and Kadira can't check oplog state.",
      solution: "Try updating your Meteor app"
    }
  }

  var result = runMatchers(preRunningMatchers, cursorDescription, observerDriver);
  if(result !== true) {
    return result;
  }

  var meteorVersion = Meteor.release;
  for(var lc=0; lc<versionMatchers.length; lc++) {
    var matcherInfo = versionMatchers[lc];
    if(matcherInfo[0].test(meteorVersion)) {
      var matched = matcherInfo[1](cursorDescription, observerDriver);
      if(matched !== true) {
        return matched;
      }
    }
  }

  result = runMatchers(globalMatchers, cursorDescription, observerDriver);
  if(result !== true) {
    return result;
  }

  return {
    code: "OPLOG_SUPPORTED",
    reason: "This query should support oplog. It's weird if it's not.",
    solution: "Please contact Kadira support and let's discuss."
  };
};

function runMatchers(matcherList, cursorDescription, observerDriver) {
  for(var lc=0; lc<matcherList.length; lc++) {
    var matcher = matcherList[lc];
    var matched = matcher(cursorDescription, observerDriver);
    if(matched !== true) {
      return matched;
    }
  }
  return true;
}
