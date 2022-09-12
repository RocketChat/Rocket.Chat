(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;

var require = meteorInstall({"node_modules":{"meteor":{"modern-browsers":{"modern.js":function module(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/modern-browsers/modern.js                                              //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
const minimumVersions = Object.create(null);
const hasOwn = Object.prototype.hasOwnProperty;

// This map defines aliasing behavior in a generic way which still permits
// minimum versions to be specified for a specific browser family.
const browserAliases = {
  chrome: [
    // chromeMobile*, per https://github.com/meteor/meteor/pull/9793,
    'chromeMobile',
    'chromeMobileIOS',
    'chromeMobileWebView',

    // The major version number of Chromium and Headless Chrome track with the
    // releases of Chrome Dev, Canary and Stable, so we should be okay to
    // alias them to Chrome in a generic sense.
    // https://www.chromium.org/developers/version-numbers
    //
    // Chromium is particularly important to list here since, unlike macOS
    // builds, Linux builds list Chromium in the userAgent along with Chrome:
    //   e.g. Chromium/70.0.3538.77 Chrome/70.0.3538.77
    'chromium',
    'headlesschrome',
  ],

  // If a call to setMinimumBrowserVersions specifies Edge 12 as a minimum
  // version, that means no version of Internet Explorer pre-Edge should
  // be classified as modern. This edge:["ie"] alias effectively enforces
  // that logic, because there is no IE12. #9818 #9839
  edge: ['ie'],

  firefox: ['firefoxMobile'],

  // The webapp package converts browser names to camel case, so
  // mobile_safari and mobileSafari should be synonymous.
  mobile_safari: ['mobileSafari', 'mobileSafariUI', 'mobileSafariUI/WKWebView'],
};

// Expand the given minimum versions by reusing chrome versions for
// chromeMobile (according to browserAliases above).
function applyAliases(versions) {
  const lowerCaseVersions = Object.create(null);

  Object.keys(versions).forEach(browser => {
    lowerCaseVersions[browser.toLowerCase()] = versions[browser];
  });

  Object.keys(browserAliases).forEach(original => {
    const aliases = browserAliases[original];
    original = original.toLowerCase();

    if (hasOwn.call(lowerCaseVersions, original)) {
      aliases.forEach(alias => {
        alias = alias.toLowerCase();
        if (!hasOwn.call(lowerCaseVersions, alias)) {
          lowerCaseVersions[alias] = lowerCaseVersions[original];
        }
      });
    }
  });

  return lowerCaseVersions;
}

// TODO Should it be possible for callers to setMinimumBrowserVersions to
// forbid any version of a particular browser?

// Given a { name, major, minor, patch } object like the one provided by
// webapp via request.browser, return true if that browser qualifies as
// "modern" according to all requested version constraints.
function isModern(browser) {
  const lowerCaseName =
    browser && typeof browser.name === 'string' && browser.name.toLowerCase();

  return (
    !!lowerCaseName &&
    hasOwn.call(minimumVersions, lowerCaseName) &&
    greaterThanOrEqualTo(
      [~~browser.major, ~~browser.minor, ~~browser.patch],
      minimumVersions[lowerCaseName].version
    )
  );
}

// Any package that depends on the modern-browsers package can call this
// function to communicate its expectations for the minimum browser
// versions that qualify as "modern." The final decision between
// web.browser.legacy and web.browser will be based on the maximum of all
// requested minimum versions for each browser.
function setMinimumBrowserVersions(versions, source) {
  const lowerCaseVersions = applyAliases(versions);

  Object.keys(lowerCaseVersions).forEach(lowerCaseName => {
    const version = lowerCaseVersions[lowerCaseName];

    if (
      hasOwn.call(minimumVersions, lowerCaseName) &&
      !greaterThan(version, minimumVersions[lowerCaseName].version)
    ) {
      return;
    }

    minimumVersions[lowerCaseName] = {
      version: copy(version),
      source: source || getCaller('setMinimumBrowserVersions'),
    };
  });
}

function getCaller(calleeName) {
  const error = new Error();
  Error.captureStackTrace(error);
  const lines = error.stack.split('\n');
  let caller;
  lines.some((line, i) => {
    if (line.indexOf(calleeName) >= 0) {
      caller = lines[i + 1].trim();
      return true;
    }
  });
  return caller;
}

Object.assign(exports, {
  isModern,
  setMinimumBrowserVersions,
  calculateHashOfMinimumVersions() {
    const { createHash } = require('crypto');
    return createHash('sha1')
      .update(JSON.stringify(minimumVersions))
      .digest('hex');
  },
});

// For making defensive copies of [major, minor, ...] version arrays, so
// they don't change unexpectedly.
function copy(version) {
  if (typeof version === 'number') {
    return version;
  }

  if (Array.isArray(version)) {
    return version.map(copy);
  }

  return version;
}

function greaterThanOrEqualTo(a, b) {
  return !greaterThan(b, a);
}

function greaterThan(a, b) {
  const as = typeof a === 'number' ? [a] : a;
  const bs = typeof b === 'number' ? [b] : b;
  const maxLen = Math.max(as.length, bs.length);

  for (let i = 0; i < maxLen; ++i) {
    a = i < as.length ? as[i] : 0;
    b = i < bs.length ? bs[i] : 0;

    if (a > b) {
      return true;
    }

    if (a < b) {
      return false;
    }
  }

  return false;
}

function makeSource(feature) {
  return module.id + ' (' + feature + ')';
}

setMinimumBrowserVersions(
  {
    chrome: 49,
    edge: 12,
    firefox: 45,
    mobileSafari: [9, 2],
    opera: 36,
    safari: 9,
    // Electron 1.0.0+ matches Chromium 49, per
    // https://github.com/Kilian/electron-to-chromium/blob/master/full-versions.js
    electron: 1,
  },
  makeSource('classes')
);

setMinimumBrowserVersions(
  {
    chrome: 39,
    edge: 13,
    firefox: 26,
    mobileSafari: 10,
    opera: 26,
    safari: 10,
    // Disallow any version of PhantomJS.
    phantomjs: Infinity,
    electron: [0, 20],
  },
  makeSource('generator functions')
);

setMinimumBrowserVersions(
  {
    chrome: 41,
    edge: 13,
    firefox: 34,
    mobileSafari: [9, 2],
    opera: 29,
    safari: [9, 1],
    electron: [0, 24],
  },
  makeSource('template literals')
);

setMinimumBrowserVersions(
  {
    chrome: 38,
    edge: 12,
    firefox: 36,
    mobileSafari: 9,
    opera: 25,
    safari: 9,
    electron: [0, 20],
  },
  makeSource('symbols')
);

/////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/modern-browsers/modern.js");

/* Exports */
Package._define("modern-browsers", exports);

})();
