// Publish the current client versions to the client.  When a client
// sees the subscription change and that there is a new version of the
// client available on the server, it can reload.
//
// By default there are two current client versions. The refreshable client
// version is identified by a hash of the client resources seen by the browser
// that are refreshable, such as CSS, while the non refreshable client version
// is identified by a hash of the rest of the client assets
// (the HTML, code, and static files in the `public` directory).
//
// If the environment variable `AUTOUPDATE_VERSION` is set it will be
// used as the client id instead.  You can use this to control when
// the client reloads.  For example, if you want to only force a
// reload on major changes, you can use a custom AUTOUPDATE_VERSION
// which you only change when something worth pushing to clients
// immediately happens.
//
// The server publishes a `meteor_autoupdate_clientVersions`
// collection. There are two documents in this collection, a document
// with _id 'version' which represents the non refreshable client assets,
// and a document with _id 'version-refreshable' which represents the
// refreshable client assets. Each document has a 'version' field
// which is equivalent to the hash of the relevant assets. The refreshable
// document also contains a list of the refreshable assets, so that the client
// can swap in the new assets without forcing a page refresh. Clients can
// observe changes on these documents to detect when there is a new
// version available.
//
// In this implementation only two documents are present in the collection
// the current refreshable client version and the current nonRefreshable client
// version.  Developers can easily experiment with different versioning and
// updating models by forking this package.

import Future from "fibers/future";

Autoupdate = {};

// The collection of acceptable client versions.
ClientVersions = new Mongo.Collection("meteor_autoupdate_clientVersions",
  { connection: null });

// The client hash includes __meteor_runtime_config__, so wait until
// all packages have loaded and have had a chance to populate the
// runtime config before using the client hash as our default auto
// update version id.

// Note: Tests allow people to override Autoupdate.autoupdateVersion before
// startup.
Autoupdate.autoupdateVersion = null;
Autoupdate.autoupdateVersionRefreshable = null;
Autoupdate.autoupdateVersionCordova = null;
Autoupdate.appId = __meteor_runtime_config__.appId = process.env.APP_ID;

var syncQueue = new Meteor._SynchronousQueue();

// updateVersions can only be called after the server has fully loaded.
var updateVersions = function (shouldReloadClientProgram) {
  // Step 1: load the current client program on the server and update the
  // hash values in __meteor_runtime_config__.
  if (shouldReloadClientProgram) {
    WebAppInternals.reloadClientPrograms();
  }

  // If we just re-read the client program, or if we don't have an autoupdate
  // version, calculate it.
  if (shouldReloadClientProgram || Autoupdate.autoupdateVersion === null) {
    Autoupdate.autoupdateVersion =
      process.env.AUTOUPDATE_VERSION ||
      WebApp.calculateClientHashNonRefreshable();
  }
  // If we just recalculated it OR if it was set by (eg) test-in-browser,
  // ensure it ends up in __meteor_runtime_config__.
  __meteor_runtime_config__.autoupdateVersion =
    Autoupdate.autoupdateVersion;

  Autoupdate.autoupdateVersionRefreshable =
    __meteor_runtime_config__.autoupdateVersionRefreshable =
      process.env.AUTOUPDATE_VERSION ||
      WebApp.calculateClientHashRefreshable();

  Autoupdate.autoupdateVersionCordova =
    __meteor_runtime_config__.autoupdateVersionCordova =
      process.env.AUTOUPDATE_VERSION ||
      WebApp.calculateClientHashCordova();

  // Step 2: form the new client boilerplate which contains the updated
  // assets and __meteor_runtime_config__.
  if (shouldReloadClientProgram) {
    WebAppInternals.generateBoilerplate();
  }

  // XXX COMPAT WITH 0.8.3
  if (! ClientVersions.findOne({current: true})) {
    // To ensure apps with version of Meteor prior to 0.9.0 (in
    // which the structure of documents in `ClientVersions` was
    // different) also reload.
    ClientVersions.insert({current: true});
  }

  if (! ClientVersions.findOne({_id: "version"})) {
    ClientVersions.insert({
      _id: "version",
      version: Autoupdate.autoupdateVersion
    });
  } else {
    ClientVersions.update("version", { $set: {
      version: Autoupdate.autoupdateVersion
    }});
  }

  if (! ClientVersions.findOne({_id: "version-cordova"})) {
    ClientVersions.insert({
      _id: "version-cordova",
      version: Autoupdate.autoupdateVersionCordova,
      refreshable: false
    });
  } else {
    ClientVersions.update("version-cordova", { $set: {
      version: Autoupdate.autoupdateVersionCordova
    }});
  }

  // Use `onListening` here because we need to use
  // `WebAppInternals.refreshableAssets`, which is only set after
  // `WebApp.generateBoilerplate` is called by `main` in webapp.
  WebApp.onListening(function () {
    if (! ClientVersions.findOne({_id: "version-refreshable"})) {
      ClientVersions.insert({
        _id: "version-refreshable",
        version: Autoupdate.autoupdateVersionRefreshable,
        assets: WebAppInternals.refreshableAssets
      });
    } else {
      ClientVersions.update("version-refreshable", { $set: {
        version: Autoupdate.autoupdateVersionRefreshable,
        assets: WebAppInternals.refreshableAssets
      }});
    }
  });
};

Meteor.publish(
  "meteor_autoupdate_clientVersions",
  function (appId) {
    // `null` happens when a client doesn't have an appId and passes
    // `undefined` to `Meteor.subscribe`. `undefined` is translated to
    // `null` as JSON doesn't have `undefined.
    check(appId, Match.OneOf(String, undefined, null));

    // Don't notify clients using wrong appId such as mobile apps built with a
    // different server but pointing at the same local url
    if (Autoupdate.appId && appId && Autoupdate.appId !== appId)
      return [];

    return ClientVersions.find();
  },
  {is_auto: true}
);

Meteor.startup(function () {
  updateVersions(false);
});

var fut = new Future();

// We only want 'refresh' to trigger 'updateVersions' AFTER onListen,
// so we add a queued task that waits for onListen before 'refresh' can queue
// tasks. Note that the `onListening` callbacks do not fire until after
// Meteor.startup, so there is no concern that the 'updateVersions' calls from
// 'refresh' will overlap with the `updateVersions` call from Meteor.startup.

syncQueue.queueTask(function () {
  fut.wait();
});

WebApp.onListening(function () {
  fut.return();
});

var enqueueVersionsRefresh = function () {
  syncQueue.queueTask(function () {
    updateVersions(true);
  });
};

// Listen for the special {refresh: 'client'} message, which signals that a
// client asset has changed.
process.on('message', Meteor.bindEnvironment(function (m) {
  if (m && m.refresh === 'client') {
    enqueueVersionsRefresh();
  }
}, "handling client refresh message"));

// Another way to tell the process to refresh: send SIGHUP signal
process.on('SIGHUP', Meteor.bindEnvironment(function () {
  enqueueVersionsRefresh();
}, "handling SIGHUP signal for refresh"));

