(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;

/* Package-scope variables */
var Promise;

var require = meteorInstall({"node_modules":{"meteor":{"promise":{"modern.js":function module(){

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/promise/modern.js                                                    //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
// Initialize the package-scoped Promise variable with global.Promise in
// all environments, even if it's not defined.
Promise = global.Promise;

///////////////////////////////////////////////////////////////////////////////////

},"server.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/promise/server.js                                                    //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
require("./extensions.js");

require("meteor-promise").makeCompatible(
  Promise,
  // Allow every Promise callback to run in a Fiber drawn from a pool of
  // reusable Fibers.
  require("fibers")
);

// Reference: https://caniuse.com/#feat=promises
require("meteor/modern-browsers").setMinimumBrowserVersions({
  chrome: 32,
  edge: 12,
  // Since there is no IE12, this effectively excludes Internet Explorer
  // (pre-Edge) from the modern classification. #9818 #9839
  ie: 12,
  firefox: 29,
  mobileSafari: 8,
  opera: 20,
  safari: [7, 1],
  // https://github.com/Kilian/electron-to-chromium/blob/master/full-versions.js
  electron: [0, 20],
}, module.id);

///////////////////////////////////////////////////////////////////////////////////

},"extensions.js":function module(){

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// packages/promise/extensions.js                                                //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
var proto = Promise.prototype;
var hasOwn = Object.prototype.hasOwnProperty;

proto.done = function (onFulfilled, onRejected) {
  var self = this;

  if (arguments.length > 0) {
    self = this.then.apply(this, arguments);
  }

  self.then(null, function (err) {
    Meteor._setImmediate(function () {
      throw err;
    });
  });
};

if (! hasOwn.call(proto, "finally")) {
  proto["finally"] = function (onFinally) {
    var threw = false, result;
    return this.then(function (value) {
      result = value;
      // Most implementations of Promise.prototype.finally call
      // Promise.resolve(onFinally()) (or this.constructor.resolve or even
      // this.constructor[Symbol.species].resolve, depending on how spec
      // compliant they're trying to be), but this implementation simply
      // relies on the standard Promise behavior of resolving any value
      // returned from a .then callback function.
      return onFinally();
    }, function (error) {
      // Make the final .then callback (below) re-throw the error instead
      // of returning it.
      threw = true;
      result = error;
      return onFinally();
    }).then(function () {
      if (threw) throw result;
      return result;
    });
  };
}

///////////////////////////////////////////////////////////////////////////////////

},"node_modules":{"meteor-promise":{"package.json":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// node_modules/meteor/promise/node_modules/meteor-promise/package.json          //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
module.exports = {
  "name": "meteor-promise",
  "version": "0.9.0",
  "main": "promise_server.js"
};

///////////////////////////////////////////////////////////////////////////////////

},"promise_server.js":function module(require,exports,module){

///////////////////////////////////////////////////////////////////////////////////
//                                                                               //
// node_modules/meteor/promise/node_modules/meteor-promise/promise_server.js     //
//                                                                               //
///////////////////////////////////////////////////////////////////////////////////
                                                                                 //
module.useNode();
///////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/promise/modern.js");
var exports = require("/node_modules/meteor/promise/server.js");

/* Exports */
Package._define("promise", exports, {
  Promise: Promise
});

})();
