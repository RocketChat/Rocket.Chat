(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var fetch;

var require = meteorInstall({"node_modules":{"meteor":{"fetch":{"server.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/fetch/server.js                                                      //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
const fetch = require("node-fetch");

exports.fetch = fetch;
exports.Headers = fetch.Headers;
exports.Request = fetch.Request;
exports.Response = fetch.Response;

const { setMinimumBrowserVersions } = require("meteor/modern-browsers");

// https://caniuse.com/#feat=fetch
setMinimumBrowserVersions({
  chrome: 42,
  edge: 14,
  firefox: 39,
  mobile_safari: [10, 3],
  opera: 29,
  safari: [10, 1],
  phantomjs: Infinity,
  // https://github.com/Kilian/electron-to-chromium/blob/master/full-versions.js
  electron: [0, 25],
}, module.id);

///////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"node-fetch":{"package.json":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// node_modules/meteor/fetch/node_modules/node-fetch/package.json                //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
module.exports = {
  "name": "node-fetch",
  "version": "2.3.0",
  "main": "lib/index"
};

///////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// node_modules/meteor/fetch/node_modules/node-fetch/lib/index.js                //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
module.useNode();
///////////////////////////////////////////////////////////////////////////////////

}}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/fetch/server.js");

/* Exports */
Package._define("fetch", exports, {
  fetch: fetch
});

})();
