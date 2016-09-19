var DEBUG_TAG = 'METEOR CORDOVA DEBUG (autoupdate_cordova.js) ';
var log = function (msg) {
  console.log(DEBUG_TAG + msg);
};

// This constant was picked by testing on iOS 7.1
// We limit the number of concurrent downloads because iOS gets angry on the
// application when a certain limit is exceeded and starts timing-out the
// connections in 1-2 minutes which makes the whole HCP really slow.
var MAX_NUM_CONCURRENT_DOWNLOADS = 30;
var MAX_RETRY_COUNT = 5;

var autoupdateVersionCordova = __meteor_runtime_config__.autoupdateVersionCordova || "unknown";

// The collection of acceptable client versions.
ClientVersions = new Mongo.Collection("meteor_autoupdate_clientVersions");

Autoupdate = {};

Autoupdate.newClientAvailable = function () {
  return !! ClientVersions.findOne({
    _id: 'version-cordova',
    version: {$ne: autoupdateVersionCordova}
  });
};

// var writeFile = function (directoryPath, fileName, content, cb) {
//   var fail = function (err) {
//     cb(new Error("Failed to write file: ", err), null);
//   };

//   window.resolveLocalFileSystemURL(directoryPath, function (dirEntry) {
//     var success = function (fileEntry) {
//       fileEntry.createWriter(function (writer) {
//         writer.onwrite = function (evt) {
//           var result = evt.target.result;
//           cb(null, result);
//         };
//         writer.onerror = fail;
//         writer.write(content);
//       }, fail);
//     };

//     dirEntry.getFile(fileName, {
//       create: true,
//       exclusive: false
//     }, success, fail);
//   }, fail);
// };

// var restartServer = function (location) {
//   log('restartServer with location ' + location);
//   var fail = function (err) { log("Unexpected error in restartServer: " + err.message) };
//   var httpd = cordova && cordova.plugins && cordova.plugins.CordovaUpdate;

//   if (! httpd) {
//     fail(new Error('no httpd'));
//     return;
//   }

//   var startServer = function (cordovajsRoot) {
//     httpd.startServer({
//       'www_root' : location,
//       'cordovajs_root': cordovajsRoot
//     }, function (url) {
//       if (Package.reload) {
//         Package.reload.Reload._reload();
//       } else {
//         window.location.reload();
//       }
//     }, fail);
//   };

//   httpd.getCordovajsRoot(function (cordovajsRoot) {
//     startServer(cordovajsRoot);
//   }, fail);
// };

var hasCalledReload = false;
var updating = false;
var localPathPrefix = null;

// var onNewVersion = function () {
//   if (!window.FileTransfer) {
//     return;
//   }
//   var ft = new FileTransfer();
//   var urlPrefix = Meteor.absoluteUrl() + '__cordova';
//   HTTP.get(urlPrefix + '/manifest.json', function (err, res) {
//     if (err || ! res.data) {
//       log('Failed to download the manifest ' + (err && err.message) + ' ' + (res && res.content));
//       return;
//     }

//     updating = true;
//     ensureLocalPathPrefix(_.bind(downloadNewVersion, null, res.data));
//   });
// };

// var downloadNewVersion = function (program) {
//   if (!window.FileTransfer) {
//     return;
//   }
//   var urlPrefix = Meteor.absoluteUrl() + '__cordova';
//   var manifest = _.clone(program.manifest);
//   var version = program.version;
//   var ft = new FileTransfer();

//   manifest.push({ url: '/index.html?' + Random.id() });

//   var versionPrefix = localPathPrefix + version;

//   var queue = [];
//   _.each(manifest, function (item) {
//     if (! item.url) return;

//     var url = item.url;
//     url = url.replace(/\?.+$/, '');

//     queue.push(url);
//   });

//   var afterAllFilesDownloaded = _.after(queue.length, function () {
//     var wroteManifest = function (err) {
//       if (err) {
//         log("Failed to write manifest.json: " + err);
//         // XXX do something smarter?
//         return;
//       }

//       // success! downloaded all sources and saved the manifest
//       // save the version string for atomicity
//       writeFile(localPathPrefix, 'version', version, function (err) {
//         if (err) {
//           log("Failed to write version: " + err);
//           return;
//         }

//         // don't call reload twice!
//         if (! hasCalledReload) {
//           var location = uriToPath(localPathPrefix + version);
//           restartServer(location);
//         }
//       });
//     };

//     writeFile(versionPrefix, 'manifest.json',
//               JSON.stringify(program, undefined, 2), wroteManifest);
//   });

//   var downloadUrl = function (url) {
//     console.log(DEBUG_TAG + "start downloading " + url);
//     // Add a cache buster to ensure that we don't cache an old asset.
//     var uri = encodeURI(urlPrefix + url + '?' + Random.id());

//     // Try to download the file a few times.
//     var tries = 0;
//     var tryDownload = function () {
//       ft.download(uri, versionPrefix + encodeURI(url), function (entry) {
//         if (entry) {
//           console.log(DEBUG_TAG + "done downloading " + url);
//           // start downloading next queued url
//           if (queue.length)
//             downloadUrl(queue.shift());
//           afterAllFilesDownloaded();
//         }
//       }, function (err) {
//         // It failed, try again if we have tried less than 5 times.
//         if (tries++ < MAX_RETRY_COUNT) {
//           log("Download error, will retry (#" + tries + "): " + uri);
//           tryDownload();
//         } else {
//           log('Download failed: ' + JSON.stringify(err) + ", source=" + err.source + ", target=" + err.target);
//         }
//       });
//     };

//     tryDownload();
//   };

//   _.times(Math.min(MAX_NUM_CONCURRENT_DOWNLOADS, queue.length), function () {
//     var nextUrl = queue.shift();
//     // XXX defer the next download so iOS doesn't rate limit us on concurrent
//     // downloads
//     Meteor.setTimeout(downloadUrl.bind(null, nextUrl), 50);
//   });
// };

var retry = new Retry({
  minCount: 0, // don't do any immediate retries
  baseTimeout: 30*1000 // start with 30s
});
var failures = 0;

Autoupdate._retrySubscription = function () {
  var appId = __meteor_runtime_config__.appId;
  Meteor.subscribe("meteor_autoupdate_clientVersions", appId, {
    onError: function (err) {
      Meteor._debug("autoupdate subscription failed:", err);
      failures++;
      retry.retryLater(failures, function () {
        // Just retry making the subscription, don't reload the whole
        // page. While reloading would catch more cases (for example,
        // the server went back a version and is now doing old-style hot
        // code push), it would also be more prone to reload loops,
        // which look really bad to the user. Just retrying the
        // subscription over DDP means it is at least possible to fix by
        // updating the server.
        Autoupdate._retrySubscription();
      });
    }
  });
  if (Package.reload) {
    var checkNewVersionDocument = function (doc) {
      var self = this;
      if (doc.version !== autoupdateVersionCordova) {
        window.fireGlobalEvent('onNewVersion', doc.version)
        // onNewVersion();
      }
    };

    var handle = ClientVersions.find({
      _id: 'version-cordova'
    }).observe({
      added: checkNewVersionDocument,
      changed: checkNewVersionDocument
    });
  }
};

// Meteor.startup(function () {
//   clearAutoupdateCache(autoupdateVersionCordova);
// });
Meteor.startup(Autoupdate._retrySubscription);


// A helper that removes old directories left from previous autoupdates
// var clearAutoupdateCache = function (currentVersion) {
//   ensureLocalPathPrefix(function () {
//     // Try to clean up our cache directory, make sure to scan the directory
//     // *before* loading the actual app. This ordering will prevent race
//     // conditions when the app code tries to download a new version before
//     // the old-cache removal has scanned the cache folder.
//     listDirectory(localPathPrefix, {dirsOnly: true}, function (err, names) {
//       // Couldn't get the list of dirs or risking to get into a race with an
//       // on-going update to disk.
//       if (err || updating) {
//         return;
//       }

//       _.each(names, function (name) {
//         // Skip the folder with the latest version
//         if (name === currentVersion)
//           return;

//         // remove everything else, as we don't want to keep too much cache
//         // around on disk
//         removeDirectory(localPathPrefix + name + '/', function (err) {
//           if (err) {
//             log('Failed to remove an old cache folder '
//                 + name + ':' + err.message);
//           } else {
//             log('Successfully removed an old cache folder ' + name);
//           }
//         });
//       });
//     });
//   })
// };

// Cordova File plugin helpers
// var listDirectory = function (url, options, cb) {
//   if (typeof options === 'function')
//     cb = options, options = {};

//   var fail = function (err) { cb(err); };
//   window.resolveLocalFileSystemURL(url, function (entry) {
//     var reader = entry.createReader();
//     reader.readEntries(function (entries) {
//       var names = [];
//       _.each(entries, function (entry) {
//         if (! options.dirsOnly || entry.isDirectory)
//           names.push(entry.name);
//       });
//       cb(null, names);
//     }, fail);
//   }, fail);
// };

// var removeDirectory = function (url, cb) {
//   var fail = function (err) {
//     cb(err);
//   };
//   window.resolveLocalFileSystemURL(url, function (entry) {
//     entry.removeRecursively(function () { cb(); }, fail);
//   }, fail);
// };

// var uriToPath = function (uri) {
//   return decodeURI(uri).replace(/^file:\/\//g, '');
// };

// var ensureLocalPathPrefix = function (cb) {
//   if (! localPathPrefix) {
//     if (! cordova.file.dataDirectory) {
//       // Since ensureLocalPathPrefix function is always called on
//       // Meteor.startup, all Cordova plugins should be ready.
//       // XXX Experiments have shown that it is not always the case, even when
//       // the cordova.file symbol is attached, properties like dataDirectory
//       // still can be null. Poll until we are sure the property is attached.
//       console.log(DEBUG_TAG + 'cordova.file.dataDirectory is null, retrying in 20ms');
//       // REMOVED to prevent loop in new app
//       // Meteor.setTimeout(_.bind(ensureLocalPathPrefix, null, cb), 20);
//     } else {
//       localPathPrefix = cordova.file.dataDirectory + 'meteor/';
//       cb();
//     }
//   } else {
//     cb();
//   }
// };

window.WebAppLocalServer = {};
WebAppLocalServer.startupDidComplete = function() {};
WebAppLocalServer.checkForUpdates = function() {};
WebAppLocalServer.onNewVersionReady = function() {};
WebAppLocalServer.onError = function() {};
