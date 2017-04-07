var hostname = Npm.require('os').hostname();
var logger = Npm.require('debug')('kadira:apm');
var Fibers = Npm.require('fibers');

var KadiraCore = Npm.require('kadira-core').Kadira;

Kadira.models = {};
Kadira.options = {};
Kadira.env = {
  currentSub: null, // keep current subscription inside ddp
  kadiraInfo: new Meteor.EnvironmentVariable(),
};
Kadira.waitTimeBuilder = new WaitTimeBuilder();
Kadira.errors = [];
Kadira.errors.addFilter = Kadira.errors.push.bind(Kadira.errors);

Kadira.models.methods = new MethodsModel();
Kadira.models.pubsub = new PubsubModel();
Kadira.models.system = new SystemModel();
Kadira.docSzCache = new DocSzCache(100000, 10);


Kadira.connect = function(appId, appSecret, options) {
  options = options || {};
  options.appId = appId;
  options.appSecret = appSecret;
  options.payloadTimeout = options.payloadTimeout || 1000 * 20;
  options.endpoint = options.endpoint || "https://enginex.kadira.io";
  options.clientEngineSyncDelay = options.clientEngineSyncDelay || 10000;
  options.thresholds = options.thresholds || {};
  options.isHostNameSet = !!options.hostname;
  options.hostname = options.hostname || hostname;
  options.proxy = options.proxy || null;

  if(options.documentSizeCacheSize) {
    Kadira.docSzCache = new DocSzCache(options.documentSizeCacheSize, 10);
  }

  // remove trailing slash from endpoint url (if any)
  if(_.last(options.endpoint) === '/') {
    options.endpoint = options.endpoint.substr(0, options.endpoint.length - 1);
  }

  // error tracking is enabled by default
  if(options.enableErrorTracking === undefined) {
    options.enableErrorTracking = true;
  }

  Kadira.options = options;
  Kadira.options.authHeaders = {
    'KADIRA-APP-ID': Kadira.options.appId,
    'KADIRA-APP-SECRET': Kadira.options.appSecret
  };

  Kadira.syncedDate = new Ntp(options.endpoint);
  Kadira.syncedDate.sync();
  Kadira.models.error = new ErrorModel(appId);

  // handle pre-added filters
  var addFilterFn = Kadira.models.error.addFilter.bind(Kadira.models.error);
  Kadira.errors.forEach(addFilterFn);
  Kadira.errors = Kadira.models.error;

  // setting runtime info, which will be sent to kadira
  __meteor_runtime_config__.kadira = {
    appId: appId,
    endpoint: options.endpoint,
    clientEngineSyncDelay: options.clientEngineSyncDelay,
  };

  if(options.enableErrorTracking) {
    Kadira.enableErrorTracking();
  } else {
    Kadira.disableErrorTracking();
  }

  if(appId && appSecret) {
    options.appId = options.appId.trim();
    options.appSecret = options.appSecret.trim();

    Kadira.coreApi = new KadiraCore({
      appId: options.appId,
      appSecret: options.appSecret,
      endpoint: options.endpoint,
      hostname: options.hostname
    });

    Kadira.coreApi._checkAuth()
      .then(function() {
        logger('connected to app: ', appId);
        console.log('Kadira: Successfully connected');
        Kadira._sendAppStats();
        Kadira._schedulePayloadSend();
      })
      .catch(function(err) {
        console.log('Kadira: authentication failed - check your appId & appSecret')
      });
  } else {
    throw new Error('Kadira: required appId and appSecret');
  }

  // start tracking errors
  Meteor.startup(function () {
    TrackUncaughtExceptions();
    TrackMeteorDebug();
  })

  Meteor.publish(null, function () {
    var options = __meteor_runtime_config__.kadira;
    this.added('kadira_settings', Random.id(), options);
    this.ready();
  });

  // notify we've connected
  Kadira.connected = true;
};

//track how many times we've sent the data (once per minute)
Kadira._buildPayload = function () {
  var payload = {host: Kadira.options.hostname};
  var buildDetailedInfo = Kadira._isDetailedInfo();
  _.extend(payload, Kadira.models.methods.buildPayload(buildDetailedInfo));
  _.extend(payload, Kadira.models.pubsub.buildPayload(buildDetailedInfo));
  _.extend(payload, Kadira.models.system.buildPayload());
  if(Kadira.options.enableErrorTracking) {
    _.extend(payload, Kadira.models.error.buildPayload());
  }

  return payload;
}

Kadira._countDataSent = 0;
Kadira._detailInfoSentInterval = Math.ceil((1000*60) / Kadira.options.payloadTimeout);
Kadira._isDetailedInfo = function () {
  return (Kadira._countDataSent++ % Kadira._detailInfoSentInterval) == 0;
}

Kadira._sendAppStats = function () {
  var appStats = {};
  appStats.release = Meteor.release;
  appStats.protocolVersion = '1.0.0';
  appStats.packageVersions = [];
  appStats.appVersions = {
    webapp: __meteor_runtime_config__['autoupdateVersion'],
    refreshable: __meteor_runtime_config__['autoupdateVersionRefreshable'],
    cordova: __meteor_runtime_config__['autoupdateVersionCordova']
  }

  // TODO get version number for installed packages
  _.each(Package, function (v, name) {
    appStats.packageVersions.push({name: name, version: null});
  });

  Kadira.coreApi.sendData({
    startTime: new Date(),
    appStats: appStats
  }).catch(function(err) {
    console.error('Kadira Error on sending appStats:', err.message);
  });
}

Kadira._schedulePayloadSend = function () {
  setTimeout(function () {
    Kadira._sendPayload(Kadira._schedulePayloadSend);
  }, Kadira.options.payloadTimeout);
}

Kadira._sendPayload = function (callback) {
  new Fibers(function() {
    var payload = Kadira._buildPayload();
    Kadira.coreApi.sendData(payload)
    .then(callback)
    .catch(function(err) {
      console.log('Kadira Error:', err.message);
      callback();
    });
  }).run();
}

// this return the __kadiraInfo from the current Fiber by default
// if called with 2nd argument as true, it will get the kadira info from
// Meteor.EnvironmentVariable
//
// WARNNING: returned info object is the reference object.
//  Changing it might cause issues when building traces. So use with care
Kadira._getInfo = function(currentFiber, useEnvironmentVariable) {
  currentFiber = currentFiber || Fibers.current;
  if(currentFiber) {
    if(useEnvironmentVariable) {
      return Kadira.env.kadiraInfo.get();
    }
    return currentFiber.__kadiraInfo;
  }
};

// this does not clone the info object. So, use with care
Kadira._setInfo = function(info) {
  Fibers.current.__kadiraInfo = info;
};

Kadira.enableErrorTracking = function () {
  __meteor_runtime_config__.kadira.enableErrorTracking = true;
  Kadira.options.enableErrorTracking = true;
};

Kadira.disableErrorTracking = function () {
  __meteor_runtime_config__.kadira.enableErrorTracking = false;
  Kadira.options.enableErrorTracking = false;
};

Kadira.trackError = function (type, message, options) {
  if(Kadira.options.enableErrorTracking && type && message) {
    options = options || {};
    options.subType = options.subType || 'server';
    options.stacks = options.stacks || '';
    var error = {message: message, stack: options.stacks};
    var trace = {
      type: type,
      subType: options.subType,
      name: message,
      errored: true,
      at: Kadira.syncedDate.getTime(),
      events: [['start', 0, {}], ['error', 0, {error: error}]],
      metrics: {total: 0}
    };
    Kadira.models.error.trackError(error, trace);
  }
}

Kadira.ignoreErrorTracking = function (err) {
  err._skipKadira = true;
}
