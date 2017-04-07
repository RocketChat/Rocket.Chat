Kadira.enableErrorTracking = function () {
  Kadira.options.enableErrorTracking = true;
};

Kadira.disableErrorTracking = function () {
  Kadira.options.enableErrorTracking = false;
};

Kadira.trackError = function (type, message, options) {
  if(Kadira.options.enableErrorTracking && type && message) {
    var now = (new Date()).getTime();
    options = options || {};
    _.defaults(options, {subType: 'client', stacks: ''});
    Kadira.errors.sendError({
      appId : Kadira.options.appId,
      name : message,
      source : 'client',
      startTime : now,
      type : type,
      subType : options.subType,
      info : getBrowserInfo(),
      stacks : JSON.stringify([{at: now, events: [], stack: options.stacks}]),
    });
  }
};

// Create new NTP object and error model immediately so it can be used
// endpoints is set later using __meteor_runtime_config__ or publication
Kadira.syncedDate = new Ntp(null);
Kadira.errors = new ErrorModel({
  waitForNtpSyncInterval: 1000 * 5, // 5 secs
  intervalInMillis: 1000 * 60 * 1, // 1minutes
  maxErrorsPerInterval: 5
});

// __meteor_runtime_config__ cannot be dynamically set for cordova apps
// using a null subscription to send required options to client
if(Meteor.isCordova) {
  var SettingsCollection = new Meteor.Collection('kadira_settings');
  SettingsCollection.find().observe({added: _.once(initialize)});
} else {
  initialize(__meteor_runtime_config__.kadira);
}

function initialize (options) {
  Kadira.options = options || {};
  _.defaults(Kadira.options, {
    errorDumpInterval: 1000*60,
    maxErrorsPerInterval: 10,
    collectAllStacks: false,
    enableErrorTracking: false,
  });

  if(Kadira.options.appId && Kadira.options.endpoint) {
    // update endpoint after receiving correct data
    Kadira.syncedDate.setEndpoint(Kadira.options.endpoint);
    Kadira.connected = true;
    Meteor.startup(function () {
      // if we don't do this this might block the initial rendering
      // or, it will show up bottom of the page, which is not cool
      setTimeout(function() {
        Kadira.syncedDate.sync();
      }, Kadira.options.clientEngineSyncDelay);
    });
  }

  if(Kadira.connected && Kadira.options.enableErrorTracking) {
    Kadira.enableErrorTracking();
  }

  if(window.Zone && Zone.inited) {
    Zone.collectAllStacks = Kadira.options.collectAllStacks;
  }
}

// patch jQuery ajax transport to use IE8/IE9 XDR if necessary
if(window.XDomainRequest) {
  fixInternetExplorerXDR();
}
