Router = function () {
  var self = this;
  this.globals = [];
  this.subscriptions = Function.prototype;

  this._tracker = this._buildTracker();
  this._current = {};

  // tracks the current path change
  this._onEveryPath = new Tracker.Dependency();

  this._globalRoute = new Route(this);

  // holds onRoute callbacks
  this._onRouteCallbacks = [];

  // if _askedToWait is true. We don't automatically start the router
  // in Meteor.startup callback. (see client/_init.js)
  // Instead user need to call `.initialize()
  this._askedToWait = false;
  this._initialized = false;
  this._triggersEnter = [];
  this._triggersExit = [];
  this._routes = [];
  this._routesMap = {};
  this._updateCallbacks();
  this.notFound = this.notfound = null;
  // indicate it's okay (or not okay) to run the tracker
  // when doing subscriptions
  // using a number and increment it help us to support FlowRouter.go()
  // and legitimate reruns inside tracker on the same event loop.
  // this is a solution for #145
  this.safeToRun = 0;

  // Meteor exposes to the client the path prefix that was defined using the
  // ROOT_URL environement variable on the server using the global runtime
  // configuration. See #315.
  this._basePath = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';

  // this is a chain contains a list of old routes
  // most of the time, there is only one old route
  // but when it's the time for a trigger redirect we've a chain
  this._oldRouteChain = [];

  this.env = {
    replaceState: new Meteor.EnvironmentVariable(),
    reload: new Meteor.EnvironmentVariable(),
    trailingSlash: new Meteor.EnvironmentVariable()
  };

  // redirect function used inside triggers
  this._redirectFn = function(pathDef, fields, queryParams) {
    if (/^http(s)?:\/\//.test(pathDef)) {
        var message = "Redirects to URLs outside of the app are not supported in this version of Flow Router. Use 'window.location = yourUrl' instead";
        throw new Error(message);
    }
    self.withReplaceState(function() {
      var path = FlowRouter.path(pathDef, fields, queryParams);
      self._page.redirect(path);
    });
  };
  this._initTriggersAPI();
};

Router.prototype.route = function(pathDef, options, group) {
  if (!/^\/.*/.test(pathDef)) {
    var message = "route's path must start with '/'";
    throw new Error(message);
  }

  options = options || {};
  var self = this;
  var route = new Route(this, pathDef, options, group);

  // calls when the page route being activates
  route._actionHandle = function (context, next) {
    var oldRoute = self._current.route;
    self._oldRouteChain.push(oldRoute);

    var queryParams = self._qs.parse(context.querystring);
    // _qs.parse() gives us a object without prototypes,
    // created with Object.create(null)
    // Meteor's check doesn't play nice with it.
    // So, we need to fix it by cloning it.
    // see more: https://github.com/meteorhacks/flow-router/issues/164
    queryParams = JSON.parse(JSON.stringify(queryParams));

    self._current = {
      path: context.path,
      context: context,
      params: context.params,
      queryParams: queryParams,
      route: route,
      oldRoute: oldRoute
    };

    // we need to invalidate if all the triggers have been completed
    // if not that means, we've been redirected to another path
    // then we don't need to invalidate
    var afterAllTriggersRan = function() {
      self._invalidateTracker();
    };

    var triggers = self._triggersEnter.concat(route._triggersEnter);
    Triggers.runTriggers(
      triggers,
      self._current,
      self._redirectFn,
      afterAllTriggersRan
    );
  };

  // calls when you exit from the page js route
  route._exitHandle = function(context, next) {
    var triggers = self._triggersExit.concat(route._triggersExit);
    Triggers.runTriggers(
      triggers,
      self._current,
      self._redirectFn,
      next
    );
  };

  this._routes.push(route);
  if (options.name) {
    this._routesMap[options.name] = route;
  }

  this._updateCallbacks();
  this._triggerRouteRegister(route);

  return route;
};

Router.prototype.group = function(options) {
  return new Group(this, options);
};

Router.prototype.path = function(pathDef, fields, queryParams) {
  if (this._routesMap[pathDef]) {
    pathDef = this._routesMap[pathDef].pathDef;
  }

  var path = "";

  // Prefix the path with the router global prefix
  if (this._basePath) {
    path += "/" + this._basePath + "/";
  }

  fields = fields || {};
  var regExp = /(:[\w\(\)\\\+\*\.\?]+)+/g;
  path += pathDef.replace(regExp, function(key) {
    var firstRegexpChar = key.indexOf("(");
    // get the content behind : and (\\d+/)
    key = key.substring(1, (firstRegexpChar > 0)? firstRegexpChar: undefined);
    // remove +?*
    key = key.replace(/[\+\*\?]+/g, "");

    // this is to allow page js to keep the custom characters as it is
    // we need to encode 2 times otherwise "/" char does not work properly
    // So, in that case, when I includes "/" it will think it's a part of the
    // route. encoding 2times fixes it
    return encodeURIComponent(encodeURIComponent(fields[key] || ""));
  });

  // Replace multiple slashes with single slash
  path = path.replace(/\/\/+/g, "/");

  // remove trailing slash
  // but keep the root slash if it's the only one
  path = path.match(/^\/{1}$/) ? path: path.replace(/\/$/, "");

  // explictly asked to add a trailing slash
  if(this.env.trailingSlash.get() && _.last(path) !== "/") {
    path += "/";
  }

  var strQueryParams = this._qs.stringify(queryParams || {});
  if(strQueryParams) {
    path += "?" + strQueryParams;
  }

  return path;
};

Router.prototype.go = function(pathDef, fields, queryParams) {
  var path = this.path(pathDef, fields, queryParams);

  var useReplaceState = this.env.replaceState.get();
  if(useReplaceState) {
    this._page.replace(path);
  } else {
    this._page(path);
  }
};

Router.prototype.reload = function() {
  var self = this;

  self.env.reload.withValue(true, function() {
    self._page.replace(self._current.path);
  });
};

Router.prototype.redirect = function(path) {
  this._page.redirect(path);
};

Router.prototype.setParams = function(newParams) {
  if(!this._current.route) {return false;}

  var pathDef = this._current.route.pathDef;
  var existingParams = this._current.params;
  var params = {};
  _.each(_.keys(existingParams), function(key) {
    params[key] = existingParams[key];
  });

  params = _.extend(params, newParams);
  var queryParams = this._current.queryParams;

  this.go(pathDef, params, queryParams);
  return true;
};

Router.prototype.setQueryParams = function(newParams) {
  if(!this._current.route) {return false;}

  var queryParams = _.clone(this._current.queryParams);
  _.extend(queryParams, newParams);

  for (var k in queryParams) {
    if (queryParams[k] === null || queryParams[k] === undefined) {
      delete queryParams[k];
    }
  }

  var pathDef = this._current.route.pathDef;
  var params = this._current.params;
  this.go(pathDef, params, queryParams);
  return true;
};

// .current is not reactive
// This is by design. use .getParam() instead
// If you really need to watch the path change, use .watchPathChange()
Router.prototype.current = function() {
  // We can't trust outside, that's why we clone this
  // Anyway, we can't clone the whole object since it has non-jsonable values
  // That's why we clone what's really needed.
  var current = _.clone(this._current);
  current.queryParams = EJSON.clone(current.queryParams);
  current.params = EJSON.clone(current.params);
  return current;
};

// Implementing Reactive APIs
var reactiveApis = [
  'getParam', 'getQueryParam',
  'getRouteName', 'watchPathChange'
];
reactiveApis.forEach(function(api) {
  Router.prototype[api] = function(arg1) {
    // when this is calling, there may not be any route initiated
    // so we need to handle it
    var currentRoute = this._current.route;
    if(!currentRoute) {
      this._onEveryPath.depend();
      return;
    }

    // currently, there is only one argument. If we've more let's add more args
    // this is not clean code, but better in performance
    return currentRoute[api].call(currentRoute, arg1);
  };
});

Router.prototype.subsReady = function() {
  var callback = null;
  var args = _.toArray(arguments);

  if (typeof _.last(args) === "function") {
    callback = args.pop();
  }

  var currentRoute = this.current().route;
  var globalRoute = this._globalRoute;

  // we need to depend for every route change and
  // rerun subscriptions to check the ready state
  this._onEveryPath.depend();

  if(!currentRoute) {
    return false;
  }

  var subscriptions;
  if(args.length === 0) {
    subscriptions = _.values(globalRoute.getAllSubscriptions());
    subscriptions = subscriptions.concat(_.values(currentRoute.getAllSubscriptions()));
  } else {
    subscriptions = _.map(args, function(subName) {
      return globalRoute.getSubscription(subName) || currentRoute.getSubscription(subName);
    });
  }

  var isReady = function() {
    var ready =  _.every(subscriptions, function(sub) {
      return sub && sub.ready();
    });

    return ready;
  };

  if (callback) {
    Tracker.autorun(function(c) {
      if (isReady()) {
        callback();
        c.stop();
      }
    });
  } else {
    return isReady();
  }
};

Router.prototype.withReplaceState = function(fn) {
  return this.env.replaceState.withValue(true, fn);
};

Router.prototype.withTrailingSlash = function(fn) {
  return this.env.trailingSlash.withValue(true, fn);
};

Router.prototype._notfoundRoute = function(context) {
  this._current = {
    path: context.path,
    context: context,
    params: [],
    queryParams: {},
  };

  // XXX this.notfound kept for backwards compatibility
  this.notFound = this.notFound || this.notfound;
  if(!this.notFound) {
    console.error("There is no route for the path:", context.path);
    return;
  }

  this._current.route = new Route(this, "*", this.notFound);
  this._invalidateTracker();
};

Router.prototype.initialize = function(options) {
  options = options || {};

  if(this._initialized) {
    throw new Error("FlowRouter is already initialized");
  }

  var self = this;
  this._updateCallbacks();

  // Implementing idempotent routing
  // by overriding page.js`s "show" method.
  // Why?
  // It is impossible to bypass exit triggers,
  // because they execute before the handler and
  // can not know what the next path is, inside exit trigger.
  //
  // we need override both show, replace to make this work
  // since we use redirect when we are talking about withReplaceState
  _.each(['show', 'replace'], function(fnName) {
    var original = self._page[fnName];
    self._page[fnName] = function(path, state, dispatch, push) {
      var reload = self.env.reload.get();
      if (!reload && self._current.path === path) {
        return;
      }

      original.call(this, path, state, dispatch, push);
    };
  });

  // this is very ugly part of pagejs and it does decoding few times
  // in unpredicatable manner. See #168
  // this is the default behaviour and we need keep it like that
  // we are doing a hack. see .path()
  this._page.base(this._basePath);
  this._page({
    decodeURLComponents: true,
    hashbang: !!options.hashbang
  });

  this._initialized = true;
};

Router.prototype._buildTracker = function() {
  var self = this;

  // main autorun function
  var tracker = Tracker.autorun(function () {
    if(!self._current || !self._current.route) {
      return;
    }

    // see the definition of `this._processingContexts`
    var currentContext = self._current;
    var route = currentContext.route;
    var path = currentContext.path;

    if(self.safeToRun === 0) {
      var message =
        "You can't use reactive data sources like Session" +
        " inside the `.subscriptions` method!";
      throw new Error(message);
    }

    // We need to run subscriptions inside a Tracker
    // to stop subs when switching between routes
    // But we don't need to run this tracker with
    // other reactive changes inside the .subscription method
    // We tackle this with the `safeToRun` variable
    self._globalRoute.clearSubscriptions();
    self.subscriptions.call(self._globalRoute, path);
    route.callSubscriptions(currentContext);

    // otherwise, computations inside action will trigger to re-run
    // this computation. which we do not need.
    Tracker.nonreactive(function() {
      var isRouteChange = currentContext.oldRoute !== currentContext.route;
      var isFirstRoute = !currentContext.oldRoute;
      // first route is not a route change
      if(isFirstRoute) {
        isRouteChange = false;
      }

      // Clear oldRouteChain just before calling the action
      // We still need to get a copy of the oldestRoute first
      // It's very important to get the oldest route and registerRouteClose() it
      // See: https://github.com/kadirahq/flow-router/issues/314
      var oldestRoute = self._oldRouteChain[0];
      self._oldRouteChain = [];

      currentContext.route.registerRouteChange(currentContext, isRouteChange);
      route.callAction(currentContext);

      Tracker.afterFlush(function() {
        self._onEveryPath.changed();
        if(isRouteChange) {
          // We need to trigger that route (definition itself) has changed.
          // So, we need to re-run all the register callbacks to current route
          // This is pretty important, otherwise tracker
          // can't identify new route's items

          // We also need to afterFlush, otherwise this will re-run
          // helpers on templates which are marked for destroying
          if(oldestRoute) {
            oldestRoute.registerRouteClose();
          }
        }
      });
    });

    self.safeToRun--;
  });

  return tracker;
};

Router.prototype._invalidateTracker = function() {
  var self = this;
  this.safeToRun++;
  this._tracker.invalidate();
  // After the invalidation we need to flush to make changes imediately
  // otherwise, we have face some issues context mix-maches and so on.
  // But there are some cases we can't flush. So we need to ready for that.

  // we clearly know, we can't flush inside an autorun
  // this may leads some issues on flow-routing
  // we may need to do some warning
  if(!Tracker.currentComputation) {
    // Still there are some cases where we can't flush
    //  eg:- when there is a flush currently
    // But we've no public API or hacks to get that state
    // So, this is the only solution
    try {
      Tracker.flush();
    } catch(ex) {
      // only handling "while flushing" errors
      if(!/Tracker\.flush while flushing/.test(ex.message)) {
        return;
      }

      // XXX: fix this with a proper solution by removing subscription mgt.
      // from the router. Then we don't need to run invalidate using a tracker

      // this happens when we are trying to invoke a route change
      // with inside a route chnage. (eg:- Template.onCreated)
      // Since we use page.js and tracker, we don't have much control
      // over this process.
      // only solution is to defer route execution.

      // It's possible to have more than one path want to defer
      // But, we only need to pick the last one.
      // self._nextPath = self._current.path;
      Meteor.defer(function() {
        var path = self._nextPath;
        if(!path) {
          return;
        }

        delete self._nextPath;
        self.env.reload.withValue(true, function() {
          self.go(path);
        });
      });
    }
  }
};

Router.prototype._updateCallbacks = function () {
  var self = this;

  self._page.callbacks = [];
  self._page.exits = [];

  _.each(self._routes, function(route) {
    self._page(route.pathDef, route._actionHandle);
    self._page.exit(route.pathDef, route._exitHandle);
  });

  self._page("*", function(context) {
    self._notfoundRoute(context);
  });
};

Router.prototype._initTriggersAPI = function() {
  var self = this;
  this.triggers = {
    enter: function(triggers, filter) {
      triggers = Triggers.applyFilters(triggers, filter);
      if(triggers.length) {
        self._triggersEnter = self._triggersEnter.concat(triggers);
      }
    },

    exit: function(triggers, filter) {
      triggers = Triggers.applyFilters(triggers, filter);
      if(triggers.length) {
        self._triggersExit = self._triggersExit.concat(triggers);
      }
    }
  };
};

Router.prototype.wait = function() {
  if(this._initialized) {
    throw new Error("can't wait after FlowRouter has been initialized");
  }

  this._askedToWait = true;
};

Router.prototype.onRouteRegister = function(cb) {
  this._onRouteCallbacks.push(cb);
};

Router.prototype._triggerRouteRegister = function(currentRoute) {
  // We should only need to send a safe set of fields on the route
  // object.
  // This is not to hide what's inside the route object, but to show
  // these are the public APIs
  var routePublicApi = _.pick(currentRoute, 'name', 'pathDef', 'path');
  var omittingOptionFields = [
    'triggersEnter', 'triggersExit', 'action', 'subscriptions', 'name'
  ];
  routePublicApi.options = _.omit(currentRoute.options, omittingOptionFields);

  _.each(this._onRouteCallbacks, function(cb) {
    cb(routePublicApi);
  });
};

Router.prototype._page = page;
Router.prototype._qs = qs;
