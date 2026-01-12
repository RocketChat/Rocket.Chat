import assert from 'assert';
import { readFileSync, chmodSync, chownSync } from 'fs';
import { createServer } from 'http';
import { userInfo } from 'os';
import { join as pathJoin, dirname as pathDirname } from 'path';
import { parse as parseUrl } from 'url';
import { createHash } from 'crypto';
import express from 'express';
import compress from 'compression';
import cookieParser from 'cookie-parser';
import qs from 'qs';
import parseRequest from 'parseurl';
import { lookup as lookupUserAgent } from 'useragent';
import { isModern } from 'meteor/modern-browsers';
import send from 'send';
import {
  removeExistingSocketFile,
  registerSocketFileCleanup,
} from './socket_file.js';
import cluster from 'cluster';
import { execSync } from 'child_process';

var SHORT_SOCKET_TIMEOUT = 5 * 1000;
var LONG_SOCKET_TIMEOUT = 120 * 1000;

const createExpressApp = () => {
  const app = express();
  // Security and performace headers
  // these headers come from these docs: https://expressjs.com/en/api.html#app.settings.table
  app.set('x-powered-by', false);
  app.set('etag', false);
  return app;
}
export const WebApp = {};
export const WebAppInternals = {};

const hasOwn = Object.prototype.hasOwnProperty;


WebAppInternals.NpmModules = {
  express : {
    version: Npm.require('express/package.json').version,
    module: express,
  }
};

// More of a convenience for the end user
WebApp.express = express;

// Though we might prefer to use web.browser (modern) as the default
// architecture, safety requires a more compatible defaultArch.
WebApp.defaultArch = 'web.browser.legacy';

// XXX maps archs to manifests
WebApp.clientPrograms = {};

// XXX maps archs to program path on filesystem
var archPath = {};

var bundledJsCssUrlRewriteHook = function(url) {
  var bundledPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
  return bundledPrefix + url;
};

var sha1 = function(contents) {
  var hash = createHash('sha256'); // FIPS COMPLIANT: sha1 -> sha256
  hash.update(contents);
  return hash.digest('hex');
};

function shouldCompress(req, res) {
  if (req.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false;
  }

  // fallback to standard filter function
  return compress.filter(req, res);
}

// #BrowserIdentification
//
// We have multiple places that want to identify the browser: the
// unsupported browser page, the appcache package, and, eventually
// delivering browser polyfills only as needed.
//
// To avoid detecting the browser in multiple places ad-hoc, we create a
// Meteor "browser" object. It uses but does not expose the npm
// useragent module (we could choose a different mechanism to identify
// the browser in the future if we wanted to).  The browser object
// contains
//
// * `name`: the name of the browser in camel case
// * `major`, `minor`, `patch`: integers describing the browser version
//
// Also here is an early version of a Meteor `request` object, intended
// to be a high-level description of the request without exposing
// details of Express's low-level `req`.  Currently it contains:
//
// * `browser`: browser identification object described above
// * `url`: parsed url, including parsed query params
//
// As a temporary hack there is a `categorizeRequest` function on WebApp which
// converts a Express `req` to a Meteor `request`. This can go away once smart
// packages such as appcache are being passed a `request` object directly when
// they serve content.
//
// This allows `request` to be used uniformly: it is passed to the html
// attributes hook, and the appcache package can use it when deciding
// whether to generate a 404 for the manifest.
//
// Real routing / server side rendering will probably refactor this
// heavily.

// e.g. "Mobile Safari" => "mobileSafari"
var camelCase = function(name) {
  var parts = name.split(' ');
  parts[0] = parts[0].toLowerCase();
  for (var i = 1; i < parts.length; ++i) {
    parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].substr(1);
  }
  return parts.join('');
};

var identifyBrowser = function(userAgentString) {
  var userAgent = lookupUserAgent(userAgentString);
  return {
    name: camelCase(userAgent.family),
    major: +userAgent.major,
    minor: +userAgent.minor,
    patch: +userAgent.patch,
  };
};

// XXX Refactor as part of implementing real routing.
WebAppInternals.identifyBrowser = identifyBrowser;

WebApp.categorizeRequest = function(req) {
  if (req.browser && req.arch && typeof req.modern === 'boolean') {
    // Already categorized.
    return req;
  }

  const browser = identifyBrowser(req.headers['user-agent']);
  const modern = isModern(browser);
  const path =
    typeof req.pathname === 'string'
      ? req.pathname
      : parseRequest(req).pathname;

  const categorized = {
    browser,
    modern,
    path,
    arch: WebApp.defaultArch,
    url: parseUrl(req.url, true),
    dynamicHead: req.dynamicHead,
    dynamicBody: req.dynamicBody,
    headers: req.headers,
    cookies: req.cookies,
  };

  const pathParts = path.split('/');
  const archKey = pathParts[1];

  if (archKey.startsWith('__')) {
    const archCleaned = 'web.' + archKey.slice(2);
    if (hasOwn.call(WebApp.clientPrograms, archCleaned)) {
      pathParts.splice(1, 1); // Remove the archKey part.
      return Object.assign(categorized, {
        arch: archCleaned,
        path: pathParts.join('/'),
      });
    }
  }

  // TODO Perhaps one day we could infer Cordova clients here, so that we
  // wouldn't have to use prefixed "/__cordova/..." URLs.
  const preferredArchOrder = isModern(browser)
    ? ['web.browser', 'web.browser.legacy']
    : ['web.browser.legacy', 'web.browser'];

  for (const arch of preferredArchOrder) {
    // If our preferred arch is not available, it's better to use another
    // client arch that is available than to guarantee the site won't work
    // by returning an unknown arch. For example, if web.browser.legacy is
    // excluded using the --exclude-archs command-line option, legacy
    // clients are better off receiving web.browser (which might actually
    // work) than receiving an HTTP 404 response. If none of the archs in
    // preferredArchOrder are defined, only then should we send a 404.
    if (hasOwn.call(WebApp.clientPrograms, arch)) {
      return Object.assign(categorized, { arch });
    }
  }

  return categorized;
};

// HTML attribute hooks: functions to be called to determine any attributes to
// be added to the '<html>' tag. Each function is passed a 'request' object (see
// #BrowserIdentification) and should return null or object.
var htmlAttributeHooks = [];
var getHtmlAttributes = function(request) {
  var combinedAttributes = {};
  _.each(htmlAttributeHooks || [], function(hook) {
    var attributes = hook(request);
    if (attributes === null) return;
    if (typeof attributes !== 'object')
      throw Error('HTML attribute hook must return null or object');
    _.extend(combinedAttributes, attributes);
  });
  return combinedAttributes;
};
WebApp.addHtmlAttributeHook = function(hook) {
  htmlAttributeHooks.push(hook);
};

// Serve app HTML for this URL?
var appUrl = function(url) {
  if (url === '/favicon.ico' || url === '/robots.txt') return false;

  // NOTE: app.manifest is not a web standard like favicon.ico and
  // robots.txt. It is a file name we have chosen to use for HTML5
  // appcache URLs. It is included here to prevent using an appcache
  // then removing it from poisoning an app permanently. Eventually,
  // once we have server side routing, this won't be needed as
  // unknown URLs with return a 404 automatically.
  if (url === '/app.manifest') return false;

  // Avoid serving app HTML for declared routes such as /sockjs/.
  if (RoutePolicy.classify(url)) return false;

  // we currently return app HTML on all URLs by default
  return true;
};

// We need to calculate the client hash after all packages have loaded
// to give them a chance to populate __meteor_runtime_config__.
//
// Calculating the hash during startup means that packages can only
// populate __meteor_runtime_config__ during load, not during startup.
//
// Calculating instead it at the beginning of main after all startup
// hooks had run would allow packages to also populate
// __meteor_runtime_config__ during startup, but that's too late for
// autoupdate because it needs to have the client hash at startup to
// insert the auto update version itself into
// __meteor_runtime_config__ to get it to the client.
//
// An alternative would be to give autoupdate a "post-start,
// pre-listen" hook to allow it to insert the auto update version at
// the right moment.

Meteor.startup(function() {
  function getter(key) {
    return function(arch) {
      arch = arch || WebApp.defaultArch;
      const program = WebApp.clientPrograms[arch];
      const value = program && program[key];
      // If this is the first time we have calculated this hash,
      // program[key] will be a thunk (lazy function with no parameters)
      // that we should call to do the actual computation.
      return typeof value === 'function' ? (program[key] = value()) : value;
    };
  }

  WebApp.calculateClientHash = WebApp.clientHash = getter('version');
  WebApp.calculateClientHashRefreshable = getter('versionRefreshable');
  WebApp.calculateClientHashNonRefreshable = getter('versionNonRefreshable');
  WebApp.calculateClientHashReplaceable = getter('versionReplaceable');
  WebApp.getRefreshableAssets = getter('refreshableAssets');
});

// When we have a request pending, we want the socket timeout to be long, to
// give ourselves a while to serve it, and to allow sockjs long polls to
// complete.  On the other hand, we want to close idle sockets relatively
// quickly, so that we can shut down relatively promptly but cleanly, without
// cutting off anyone's response.
WebApp._timeoutAdjustmentRequestCallback = function(req, res) {
  // this is really just req.socket.setTimeout(LONG_SOCKET_TIMEOUT);
  req.setTimeout(LONG_SOCKET_TIMEOUT);
  // Insert our new finish listener to run BEFORE the existing one which removes
  // the response from the socket.
  var finishListeners = res.listeners('finish');
  // XXX Apparently in Node 0.12 this event was called 'prefinish'.
  // https://github.com/joyent/node/commit/7c9b6070
  // But it has switched back to 'finish' in Node v4:
  // https://github.com/nodejs/node/pull/1411
  res.removeAllListeners('finish');
  res.on('finish', function() {
    res.setTimeout(SHORT_SOCKET_TIMEOUT);
  });
  _.each(finishListeners, function(l) {
    res.on('finish', l);
  });
};

// Will be updated by main before we listen.
// Map from client arch to boilerplate object.
// Boilerplate object has:
//   - func: XXX
//   - baseData: XXX
var boilerplateByArch = {};

// Register a callback function that can selectively modify boilerplate
// data given arguments (request, data, arch). The key should be a unique
// identifier, to prevent accumulating duplicate callbacks from the same
// call site over time. Callbacks will be called in the order they were
// registered. A callback should return false if it did not make any
// changes affecting the boilerplate. Passing null deletes the callback.
// Any previous callback registered for this key will be returned.
const boilerplateDataCallbacks = Object.create(null);
WebAppInternals.registerBoilerplateDataCallback = function(key, callback) {
  const previousCallback = boilerplateDataCallbacks[key];

  if (typeof callback === 'function') {
    boilerplateDataCallbacks[key] = callback;
  } else {
    assert.strictEqual(callback, null);
    delete boilerplateDataCallbacks[key];
  }

  // Return the previous callback in case the new callback needs to call
  // it; for example, when the new callback is a wrapper for the old.
  return previousCallback || null;
};

// Given a request (as returned from `categorizeRequest`), return the
// boilerplate HTML to serve for that request.
//
// If a previous Express middleware has rendered content for the head or body,
// returns the boilerplate with that content patched in otherwise
// memoizes on HTML attributes (used by, eg, appcache) and whether inline
// scripts are currently allowed.
// XXX so far this function is always called with arch === 'web.browser'
function getBoilerplate(request, arch) {
  return getBoilerplateAsync(request, arch);
}

/**
 * @summary Takes a runtime configuration object and
 * returns an encoded runtime string.
 * @locus Server
 * @param {Object} rtimeConfig
 * @returns {String}
 */
WebApp.encodeRuntimeConfig = function(rtimeConfig) {
  return JSON.stringify(encodeURIComponent(JSON.stringify(rtimeConfig)));
};

/**
 * @summary Takes an encoded runtime string and returns
 * a runtime configuration object.
 * @locus Server
 * @param {String} rtimeConfigString
 * @returns {Object}
 */
WebApp.decodeRuntimeConfig = function(rtimeConfigStr) {
  return JSON.parse(decodeURIComponent(JSON.parse(rtimeConfigStr)));
};

const runtimeConfig = {
  // hooks will contain the callback functions
  // set by the caller to addRuntimeConfigHook
  hooks: new Hook(),
  // updateHooks will contain the callback functions
  // set by the caller to addUpdatedNotifyHook
  updateHooks: new Hook(),
  // isUpdatedByArch is an object containing fields for each arch
  // that this server supports.
  // - Each field will be true when the server updates the runtimeConfig for that arch.
  // - When the hook callback is called the update field in the callback object will be
  // set to isUpdatedByArch[arch].
  // = isUpdatedyByArch[arch] is reset to false after the callback.
  // This enables the caller to cache data efficiently so they do not need to
  // decode & update data on every callback when the runtimeConfig is not changing.
  isUpdatedByArch: {},
};

/**
 * @name addRuntimeConfigHookCallback(options)
 * @locus Server
 * @isprototype true
 * @summary Callback for `addRuntimeConfigHook`.
 *
 * If the handler returns a _falsy_ value the hook will not
 * modify the runtime configuration.
 *
 * If the handler returns a _String_ the hook will substitute
 * the string for the encoded configuration string.
 *
 * **Warning:** the hook does not check the return value at all it is
 * the responsibility of the caller to get the formatting correct using
 * the helper functions.
 *
 * `addRuntimeConfigHookCallback` takes only one `Object` argument
 * with the following fields:
 * @param {Object} options
 * @param {String} options.arch The architecture of the client
 * requesting a new runtime configuration. This can be one of
 * `web.browser`, `web.browser.legacy` or `web.cordova`.
 * @param {Object} options.request
 * A NodeJs [IncomingMessage](https://nodejs.org/api/http.html#http_class_http_incomingmessage)
 * https://nodejs.org/api/http.html#http_class_http_incomingmessage
 * `Object` that can be used to get information about the incoming request.
 * @param {String} options.encodedCurrentConfig The current configuration object
 * encoded as a string for inclusion in the root html.
 * @param {Boolean} options.updated `true` if the config for this architecture
 * has been updated since last called, otherwise `false`. This flag can be used
 * to cache the decoding/encoding for each architecture.
 */

/**
 * @summary Hook that calls back when the meteor runtime configuration,
 * `__meteor_runtime_config__` is being sent to any client.
 *
 * **returns**: <small>_Object_</small> `{ stop: function, callback: function }`
 * - `stop` <small>_Function_</small> Call `stop()` to stop getting callbacks.
 * - `callback` <small>_Function_</small> The passed in `callback`.
 * @locus Server
 * @param {addRuntimeConfigHookCallback} callback
 * See `addRuntimeConfigHookCallback` description.
 * @returns {Object} {{ stop: function, callback: function }}
 * Call the returned `stop()` to stop getting callbacks.
 * The passed in `callback` is returned also.
 */
WebApp.addRuntimeConfigHook = function(callback) {
  return runtimeConfig.hooks.register(callback);
};

async function getBoilerplateAsync(request, arch) {
  let boilerplate = boilerplateByArch[arch];
  await runtimeConfig.hooks.forEachAsync(async hook => {
    const meteorRuntimeConfig = await hook({
      arch,
      request,
      encodedCurrentConfig: boilerplate.baseData.meteorRuntimeConfig,
      updated: runtimeConfig.isUpdatedByArch[arch],
    });
    if (!meteorRuntimeConfig) return true;
    boilerplate.baseData = Object.assign({}, boilerplate.baseData, {
      meteorRuntimeConfig,
    });
    return true;
  });
  runtimeConfig.isUpdatedByArch[arch] = false;
  const data = Object.assign(
    {},
    boilerplate.baseData,
    {
      htmlAttributes: getHtmlAttributes(request),
    },
    _.pick(request, 'dynamicHead', 'dynamicBody')
  );

  let madeChanges = false;
  let promise = Promise.resolve();

  Object.keys(boilerplateDataCallbacks).forEach(key => {
    promise = promise
      .then(() => {
        const callback = boilerplateDataCallbacks[key];
        return callback(request, data, arch);
      })
      .then(result => {
        // Callbacks should return false if they did not make any changes.
        if (result !== false) {
          madeChanges = true;
        }
      });
  });

  return promise.then(() => ({
    stream: boilerplate.toHTMLStream(data),
    statusCode: data.statusCode,
    headers: data.headers,
  }));
}

/**
 * @name addUpdatedNotifyHookCallback(options)
 * @summary callback handler for `addupdatedNotifyHook`
 * @isprototype true
 * @locus Server
 * @param {Object} options
 * @param {String} options.arch The architecture that is being updated.
 * This can be one of `web.browser`, `web.browser.legacy` or `web.cordova`.
 * @param {Object} options.manifest The new updated manifest object for
 * this `arch`.
 * @param {Object} options.runtimeConfig The new updated configuration
 * object for this `arch`.
 */

/**
 * @summary Hook that runs when the meteor runtime configuration
 * is updated.  Typically the configuration only changes during development mode.
 * @locus Server
 * @param {addUpdatedNotifyHookCallback} handler
 * The `handler` is called on every change to an `arch` runtime configuration.
 * See `addUpdatedNotifyHookCallback`.
 * @returns {Object} {{ stop: function, callback: function }}
 */
WebApp.addUpdatedNotifyHook = function(handler) {
  return runtimeConfig.updateHooks.register(handler);
};

WebAppInternals.generateBoilerplateInstance = function(
  arch,
  manifest,
  additionalOptions
) {
  additionalOptions = additionalOptions || {};

  runtimeConfig.isUpdatedByArch[arch] = true;
  const rtimeConfig = {
    ...__meteor_runtime_config__,
    ...(additionalOptions.runtimeConfigOverrides || {}),
  };
  runtimeConfig.updateHooks.forEach(cb => {
    cb({ arch, manifest, runtimeConfig: rtimeConfig });
    return true;
  });

  const meteorRuntimeConfig = JSON.stringify(
    encodeURIComponent(JSON.stringify(rtimeConfig))
  );

  return new Boilerplate(
    arch,
    manifest,
    Object.assign(
      {
        pathMapper(itemPath) {
          return pathJoin(archPath[arch], itemPath);
        },
        baseDataExtension: {
          additionalStaticJs: _.map(additionalStaticJs || [], function(
            contents,
            pathname
          ) {
            return {
              pathname: pathname,
              contents: contents,
            };
          }),
          // Convert to a JSON string, then get rid of most weird characters, then
          // wrap in double quotes. (The outermost JSON.stringify really ought to
          // just be "wrap in double quotes" but we use it to be safe.) This might
          // end up inside a <script> tag so we need to be careful to not include
          // "</script>", but normal {{spacebars}} escaping escapes too much! See
          // https://github.com/meteor/meteor/issues/3730
          meteorRuntimeConfig,
          meteorRuntimeHash: sha1(meteorRuntimeConfig),
          rootUrlPathPrefix:
            __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '',
          bundledJsCssUrlRewriteHook: bundledJsCssUrlRewriteHook,
          sriMode: sriMode,
          inlineScriptsAllowed: WebAppInternals.inlineScriptsAllowed(),
          inline: additionalOptions.inline,
        },
      },
      additionalOptions
    )
  );
};

// A mapping from url path to architecture (e.g. "web.browser") to static
// file information with the following fields:
// - type: the type of file to be served
// - cacheable: optionally, whether the file should be cached or not
// - sourceMapUrl: optionally, the url of the source map
//
// Info also contains one of the following:
// - content: the stringified content that should be served at this path
// - absolutePath: the absolute path on disk to the file

// Serve static files from the manifest or added with
// `addStaticJs`. Exported for tests.
WebAppInternals.staticFilesMiddleware = async function(
  staticFilesByArch,
  req,
  res,
  next
) {
  var pathname = parseRequest(req).pathname;
  try {
    pathname = decodeURIComponent(pathname);
  } catch (e) {
    next();
    return;
  }

  var serveStaticJs = function(s) {
    if (
      req.method === 'GET' ||
      req.method === 'HEAD' ||
      Meteor.settings.packages?.webapp?.alwaysReturnContent
    ) {
      res.writeHead(200, {
        'Content-type': 'application/javascript; charset=UTF-8',
        'Content-Length': Buffer.byteLength(s),
      });
      res.write(s);
      res.end();
    } else {
      const status = req.method === 'OPTIONS' ? 200 : 405;
      res.writeHead(status, {
        Allow: 'OPTIONS, GET, HEAD',
        'Content-Length': '0',
      });
      res.end();
    }
  };

  if (
    _.has(additionalStaticJs, pathname) &&
    !WebAppInternals.inlineScriptsAllowed()
  ) {
    serveStaticJs(additionalStaticJs[pathname]);
    return;
  }

  const { arch, path } = WebApp.categorizeRequest(req);

  if (!hasOwn.call(WebApp.clientPrograms, arch)) {
    // We could come here in case we run with some architectures excluded
    next();
    return;
  }

  // If pauseClient(arch) has been called, program.paused will be a
  // Promise that will be resolved when the program is unpaused.
  const program = WebApp.clientPrograms[arch];
  await program.paused;

  if (
    path === '/meteor_runtime_config.js' &&
    !WebAppInternals.inlineScriptsAllowed()
  ) {
    console.log('DEBUG: serving meteor_runtime_config manually');
    try {
        const content = `__meteor_runtime_config__ = ${program.meteorRuntimeConfig};`;
        const len = Buffer.byteLength(content);
        console.log('DEBUG: content length', len);
        console.log('DEBUG: config preview', content.substring(0, 100));
        
        res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
        res.setHeader('Content-Length', len);
        res.writeHead(200);
        res.write(content);
        res.end();
        console.log('DEBUG: finished response', { headersSent: res.headersSent, finished: res.finished });
    } catch (e) {
        console.error('DEBUG: error serving runtime config', e);
        if (!res.headersSent) res.writeHead(500);
        res.end(e.toString());
    }
    return;
  }

  const info = getStaticFileInfo(staticFilesByArch, pathname, path, arch);
  if (!info) {
    next();
    return;
  }
  // "send" will handle HEAD & GET requests
  if (
    req.method !== 'HEAD' &&
    req.method !== 'GET' &&
    !Meteor.settings.packages?.webapp?.alwaysReturnContent
  ) {
    const status = req.method === 'OPTIONS' ? 200 : 405;
    res.writeHead(status, {
      Allow: 'OPTIONS, GET, HEAD',
      'Content-Length': '0',
    });
    res.end();
    return;
  }

  // We don't need to call pause because, unlike 'static', once we call into
  // 'send' and yield to the event loop, we never call another handler with
  // 'next'.

  // Cacheable files are files that should never change. Typically
  // named by their hash (eg meteor bundled js and css files).
  // We cache them ~forever (1yr).
  const maxAge = info.cacheable ? 1000 * 60 * 60 * 24 * 365 : 0;

  if (info.cacheable) {
    // Since we use req.headers["user-agent"] to determine whether the
    // client should receive modern or legacy resources, tell the client
    // to invalidate cached resources when/if its user agent string
    // changes in the future.
    res.setHeader('Vary', 'User-Agent');
  }

  // Set the X-SourceMap header, which current Chrome, FireFox, and Safari
  // understand.  (The SourceMap header is slightly more spec-correct but FF
  // doesn't understand it.)
  //
  // You may also need to enable source maps in Chrome: open dev tools, click
  // the gear in the bottom right corner, and select "enable source maps".
  if (info.sourceMapUrl) {
    res.setHeader(
      'X-SourceMap',
      __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + info.sourceMapUrl
    );
  }

  if (info.type === 'js' || info.type === 'dynamic js') {
    res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
  } else if (info.type === 'css') {
    res.setHeader('Content-Type', 'text/css; charset=UTF-8');
  } else if (info.type === 'json') {
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');
  }

  if (info.hash) {
    res.setHeader('ETag', '"' + info.hash + '"');
  }

  if (info.content) {
    res.setHeader('Content-Length', Buffer.byteLength(info.content));
    res.write(info.content);
    res.end();
  } else {
    send(req, info.absolutePath, {
      maxage: maxAge,
      dotfiles: 'allow', // if we specified a dotfile in the manifest, serve it
      lastModified: false, // don't set last-modified based on the file date
    })
      .on('error', function(err) {
        Log.error('Error serving static file ' + err);
        res.writeHead(500);
        res.end();
      })
      .on('directory', function() {
        Log.error('Unexpected directory ' + info.absolutePath);
        res.writeHead(500);
        res.end();
      })
      .pipe(res);
  }
};

function getStaticFileInfo(staticFilesByArch, originalPath, path, arch) {
  if (!hasOwn.call(WebApp.clientPrograms, arch)) {
    return null;
  }

  // Get a list of all available static file architectures, with arch
  // first in the list if it exists.
  const staticArchList = Object.keys(staticFilesByArch);
  const archIndex = staticArchList.indexOf(arch);
  if (archIndex > 0) {
    staticArchList.unshift(staticArchList.splice(archIndex, 1)[0]);
  }

  let info = null;

  staticArchList.some(arch => {
    const staticFiles = staticFilesByArch[arch];

    function finalize(path) {
      info = staticFiles[path];
      // Sometimes we register a lazy function instead of actual data in
      // the staticFiles manifest.
      if (typeof info === 'function') {
        info = staticFiles[path] = info();
      }
      return info;
    }

    // If staticFiles contains originalPath with the arch inferred above,
    // use that information.
    if (hasOwn.call(staticFiles, originalPath)) {
      return finalize(originalPath);
    }

    // If categorizeRequest returned an alternate path, try that instead.
    if (path !== originalPath && hasOwn.call(staticFiles, path)) {
      return finalize(path);
    }
  });

  return info;
}

// Parse the passed in port value. Return the port as-is if it's a String
// (e.g. a Windows Server style named pipe), otherwise return the port as an
// integer.
//
// DEPRECATED: Direct use of this function is not recommended; it is no
// longer used internally, and will be removed in a future release.
WebAppInternals.parsePort = port => {
  let parsedPort = parseInt(port);
  if (Number.isNaN(parsedPort)) {
    parsedPort = port;
  }
  return parsedPort;
};

import { onMessage } from 'meteor/inter-process-messaging';

onMessage('webapp-pause-client', async ({ arch }) => {
  await WebAppInternals.pauseClient(arch);
});

onMessage('webapp-reload-client', async ({ arch }) => {
  await WebAppInternals.generateClientProgram(arch);
});

async function runWebAppServer() {
  var shuttingDown = false;
  var syncQueue = new Meteor._AsynchronousQueue();

  var getItemPathname = function(itemUrl) {
    return decodeURIComponent(parseUrl(itemUrl).pathname);
  };

  WebAppInternals.reloadClientPrograms = async function() {
    await syncQueue.runTask(function() {
      const staticFilesByArch = Object.create(null);

      const { configJson } = __meteor_bootstrap__;
      const clientArchs =
        configJson.clientArchs || Object.keys(configJson.clientPaths);

      try {
        clientArchs.forEach(arch => {
          generateClientProgram(arch, staticFilesByArch);
        });
        WebAppInternals.staticFilesByArch = staticFilesByArch;
      } catch (e) {
        Log.error('Error reloading the client program: ' + e.stack);
        process.exit(1);
      }
    });
  };

  // Pause any incoming requests and make them wait for the program to be
  // unpaused the next time generateClientProgram(arch) is called.
  WebAppInternals.pauseClient = async function(arch) {
    await syncQueue.runTask(() => {
      const program = WebApp.clientPrograms[arch];
      const { unpause } = program;
      program.paused = new Promise(resolve => {
        if (typeof unpause === 'function') {
          // If there happens to be an existing program.unpause function,
          // compose it with the resolve function.
          program.unpause = function() {
            unpause();
            resolve();
          };
        } else {
          program.unpause = resolve;
        }
      });
    });
  };

  WebAppInternals.generateClientProgram = async function(arch) {
    await syncQueue.runTask(() => generateClientProgram(arch));
  };

  function generateClientProgram(
    arch,
    staticFilesByArch = WebAppInternals.staticFilesByArch
  ) {
    const clientDir = pathJoin(
      pathDirname(__meteor_bootstrap__.serverDir),
      arch
    );

    // read the control for the client we'll be serving up
    const programJsonPath = pathJoin(clientDir, 'program.json');

    let programJson;
    try {
      programJson = JSON.parse(readFileSync(programJsonPath));
    } catch (e) {
      if (e.code === 'ENOENT') return;
      throw e;
    }

    if (programJson.format !== 'web-program-pre1') {
      throw new Error(
        'Unsupported format for client assets: ' +
          JSON.stringify(programJson.format)
      );
    }

    if (!programJsonPath || !clientDir || !programJson) {
      throw new Error('Client config file not parsed.');
    }

    archPath[arch] = clientDir;
    const staticFiles = (staticFilesByArch[arch] = Object.create(null));

    const { manifest } = programJson;
    manifest.forEach(item => {
      if (item.url && item.where === 'client') {
        staticFiles[getItemPathname(item.url)] = {
          absolutePath: pathJoin(clientDir, item.path),
          cacheable: item.cacheable,
          hash: item.hash,
          // Link from source to its map
          sourceMapUrl: item.sourceMapUrl,
          type: item.type,
        };

        if (item.sourceMap) {
          // Serve the source map too, under the specified URL. We assume
          // all source maps are cacheable.
          staticFiles[getItemPathname(item.sourceMapUrl)] = {
            absolutePath: pathJoin(clientDir, item.sourceMap),
            cacheable: true,
          };
        }
      }
    });

    const { PUBLIC_SETTINGS } = __meteor_runtime_config__;
    const configOverrides = {
      PUBLIC_SETTINGS,
    };

    const oldProgram = WebApp.clientPrograms[arch];
    const newProgram = (WebApp.clientPrograms[arch] = {
      format: 'web-program-pre1',
      manifest: manifest,
      // Use arrow functions so that these versions can be lazily
      // calculated later, and so that they will not be included in the
      // staticFiles[manifestUrl].content string below.
      //
      // Note: these version calculations must be kept in agreement with
      // CordovaBuilder#appendVersion in tools/cordova/builder.js, or hot
      // code push will reload Cordova apps unnecessarily.
      version: () =>
        WebAppHashing.calculateClientHash(manifest, null, configOverrides),
      versionRefreshable: () =>
        WebAppHashing.calculateClientHash(
          manifest,
          type => type === 'css',
          configOverrides
        ),
      versionNonRefreshable: () =>
        WebAppHashing.calculateClientHash(
          manifest,
          (type, replaceable) => type !== 'css' && !replaceable,
          configOverrides
        ),
      versionReplaceable: () =>
        WebAppHashing.calculateClientHash(
          manifest,
          (_type, replaceable) => replaceable,
          configOverrides
        ),
      cordovaCompatibilityVersions: programJson.cordovaCompatibilityVersions,
      PUBLIC_SETTINGS,
      hmrVersion: programJson.hmrVersion,
    });

    // Expose program details as a string reachable via the following URL.
    const manifestUrlPrefix = '/__' + arch.replace(/^web\./, '');
    const manifestUrl = manifestUrlPrefix + getItemPathname('/manifest.json');

    staticFiles[manifestUrl] = () => {
      if (Package.autoupdate) {
        const {
          AUTOUPDATE_VERSION = Package.autoupdate.Autoupdate.autoupdateVersion,
        } = process.env;

        if (AUTOUPDATE_VERSION) {
          newProgram.version = AUTOUPDATE_VERSION;
        }
      }

      if (typeof newProgram.version === 'function') {
        newProgram.version = newProgram.version();
      }

      return {
        content: JSON.stringify(newProgram),
        cacheable: false,
        hash: newProgram.version,
        type: 'json',
      };
    };

    generateBoilerplateForArch(arch);

    // If there are any requests waiting on oldProgram.paused, let them
    // continue now (using the new program).
    if (oldProgram && oldProgram.paused) {
      oldProgram.unpause();
    }
  }

  const defaultOptionsForArch = {
    'web.cordova': {
      runtimeConfigOverrides: {
        // XXX We use absoluteUrl() here so that we serve https://
        // URLs to cordova clients if force-ssl is in use. If we were
        // to use __meteor_runtime_config__.ROOT_URL instead of
        // absoluteUrl(), then Cordova clients would immediately get a
        // HCP setting their DDP_DEFAULT_CONNECTION_URL to
        // http://example.meteor.com. This breaks the app, because
        // force-ssl doesn't serve CORS headers on 302
        // redirects. (Plus it's undesirable to have clients
        // connecting to http://example.meteor.com when force-ssl is
        // in use.)
        DDP_DEFAULT_CONNECTION_URL:
          process.env.MOBILE_DDP_URL || Meteor.absoluteUrl(),
        ROOT_URL: process.env.MOBILE_ROOT_URL || Meteor.absoluteUrl(),
      },
    },

    'web.browser': {
      runtimeConfigOverrides: {
        isModern: true,
      },
    },

    'web.browser.legacy': {
      runtimeConfigOverrides: {
        isModern: false,
      },
    },
  };

  WebAppInternals.generateBoilerplate = async function() {
    // This boilerplate will be served to the mobile devices when used with
    // Meteor/Cordova for the Hot-Code Push and since the file will be served by
    // the device's server, it is important to set the DDP url to the actual
    // Meteor server accepting DDP connections and not the device's file server.
    await syncQueue.runTask(function() {
      Object.keys(WebApp.clientPrograms).forEach(generateBoilerplateForArch);
    });
  };

  function generateBoilerplateForArch(arch) {
    const program = WebApp.clientPrograms[arch];
    const additionalOptions = defaultOptionsForArch[arch] || {};
    const { baseData } = (boilerplateByArch[
      arch
    ] = WebAppInternals.generateBoilerplateInstance(
      arch,
      program.manifest,
      additionalOptions
    ));
    // We need the runtime config with overrides for meteor_runtime_config.js:
    program.meteorRuntimeConfig = JSON.stringify({
      ...__meteor_runtime_config__,
      ...(additionalOptions.runtimeConfigOverrides || null),
    });
    program.refreshableAssets = baseData.css.map(file => ({
      url: bundledJsCssUrlRewriteHook(file.url),
    }));
  }

  await WebAppInternals.reloadClientPrograms();

  // webserver
  var app = createExpressApp()

  // Packages and apps can add handlers that run before any other Meteor
  // handlers via WebApp.rawExpressHandlers.
  var rawExpressHandlers = createExpressApp()
  app.use(rawExpressHandlers);

  // Auto-compress any json, javascript, or text.
  app.use(compress({ filter: shouldCompress }));

  // parse cookies into an object
  app.use(cookieParser());

  // We're not a proxy; reject (without crashing) attempts to treat us like
  // one. (See #1212.)
  app.use(function(req, res, next) {
    if (RoutePolicy.isValidUrl(req.url)) {
      next();
      return;
    }
    res.writeHead(400);
    res.write('Not a proxy');
    res.end();
  });

  // Parse the query string into res.query. Used by oauth_server, but it's
  // generally pretty handy..
  //
  // Do this before the next middleware destroys req.url if a path prefix
  // is set to close #10111.
  app.use(function(request, response, next) {
    request.query = qs.parse(parseUrl(request.url).query);
    next();
  });

  function getPathParts(path) {
    const parts = path.split('/');
    while (parts[0] === '') parts.shift();
    return parts;
  }

  function isPrefixOf(prefix, array) {
    return (
      prefix.length <= array.length &&
      prefix.every((part, i) => part === array[i])
    );
  }

  // Strip off the path prefix, if it exists.
  app.use(function(request, response, next) {
    const pathPrefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX;
    const { pathname, search } = parseUrl(request.url);

    // check if the path in the url starts with the path prefix
    if (pathPrefix) {
      const prefixParts = getPathParts(pathPrefix);
      const pathParts = getPathParts(pathname);
      if (isPrefixOf(prefixParts, pathParts)) {
        request.url = '/' + pathParts.slice(prefixParts.length).join('/');
        if (search) {
          request.url += search;
        }
        return next();
      }
    }

    if (pathname === '/favicon.ico' || pathname === '/robots.txt') {
      return next();
    }

    if (pathPrefix) {
      response.writeHead(404);
      response.write('Unknown path');
      response.end();
      return;
    }

    next();
  });

  // Serve static files from the manifest.
  // This is inspired by the 'static' middleware.
  app.use(function(req, res, next) {
    // console.log(String(arguments.callee));
    WebAppInternals.staticFilesMiddleware(
      WebAppInternals.staticFilesByArch,
      req,
      res,
      next
    );
  });

  // Core Meteor packages like dynamic-import can add handlers before
  // other handlers added by package and application code.
  app.use((WebAppInternals.meteorInternalHandlers = createExpressApp()));

  /**
   * @name expressHandlersCallback(req, res, next)
   * @locus Server
   * @isprototype true
   * @summary callback handler for `WebApp.expressHandlers`
   * @param {Object} req
   * a Node.js
   * [IncomingMessage](https://nodejs.org/api/http.html#class-httpincomingmessage)
   * object with some extra properties. This argument can be used
   *  to get information about the incoming request.
   * @param {Object} res
   * a Node.js
   * [ServerResponse](https://nodejs.org/api/http.html#class-httpserverresponse)
   * object. Use this to write data that should be sent in response to the
   * request, and call `res.end()` when you are done.
   * @param {Function} next
   * Calling this function will pass on the handling of
   * this request to the next relevant handler.
   *
   */

  /**
   * @method handlers
   * @memberof WebApp
   * @locus Server
   * @summary Register a handler for all HTTP requests.
   * @param {String} [path]
   * This handler will only be called on paths that match
   * this string. The match has to border on a `/` or a `.`.
   *
   * For example, `/hello` will match `/hello/world` and
   * `/hello.world`, but not `/hello_world`.
   * @param {expressHandlersCallback} handler
   * A handler function that will be called on HTTP requests.
   * See `expressHandlersCallback`
   *
   */
  // Packages and apps can add handlers to this via WebApp.expressHandlers.
  // They are inserted before our default handler.
  var packageAndAppHandlers = createExpressApp()
  app.use(packageAndAppHandlers);

  let suppressExpressErrors = false;
  // Express knows it is an error handler because it has 4 arguments instead of
  // 3. go figure.  (It is not smart enough to find such a thing if it's hidden
  // inside packageAndAppHandlers.)
  app.use(function(err, req, res, next) {
    if (!err || !suppressExpressErrors || !req.headers['x-suppress-error']) {
      next(err);
      return;
    }
    res.writeHead(err.status, { 'Content-Type': 'text/plain' });
    res.end('An error message');
  });

  app.use(async function(req, res, next) {
    if (!appUrl(req.url)) {
      return next();
    } else if (
      req.method !== 'HEAD' &&
      req.method !== 'GET' &&
      !Meteor.settings.packages?.webapp?.alwaysReturnContent
    ) {
      const status = req.method === 'OPTIONS' ? 200 : 405;
      res.writeHead(status, {
        Allow: 'OPTIONS, GET, HEAD',
        'Content-Length': '0',
      });
      res.end();
    } else {
      var headers = {
        'Content-Type': 'text/html; charset=utf-8',
      };

      if (shuttingDown) {
        headers['Connection'] = 'Close';
      }

      var request = WebApp.categorizeRequest(req);

      if (request.url.query && request.url.query['meteor_css_resource']) {
        // In this case, we're requesting a CSS resource in the meteor-specific
        // way, but we don't have it.  Serve a static css file that indicates that
        // we didn't have it, so we can detect that and refresh.  Make sure
        // that any proxies or CDNs don't cache this error!  (Normally proxies
        // or CDNs are smart enough not to cache error pages, but in order to
        // make this hack work, we need to return the CSS file as a 200, which
        // would otherwise be cached.)
        headers['Content-Type'] = 'text/css; charset=utf-8';
        headers['Cache-Control'] = 'no-cache';
        res.writeHead(200, headers);
        res.write('.meteor-css-not-found-error { width: 0px;}');
        res.end();
        return;
      }

      if (request.url.query && request.url.query['meteor_js_resource']) {
        // Similarly, we're requesting a JS resource that we don't have.
        // Serve an uncached 404. (We can't use the same hack we use for CSS,
        // because actually acting on that hack requires us to have the JS
        // already!)
        headers['Cache-Control'] = 'no-cache';
        res.writeHead(404, headers);
        res.end('404 Not Found');
        return;
      }

      if (request.url.query && request.url.query['meteor_dont_serve_index']) {
        // When downloading files during a Cordova hot code push, we need
        // to detect if a file is not available instead of inadvertently
        // downloading the default index page.
        // So similar to the situation above, we serve an uncached 404.
        headers['Cache-Control'] = 'no-cache';
        res.writeHead(404, headers);
        res.end('404 Not Found');
        return;
      }

      const { arch } = request;
      assert.strictEqual(typeof arch, 'string', { arch });

      if (!hasOwn.call(WebApp.clientPrograms, arch)) {
        // We could come here in case we run with some architectures excluded
        headers['Cache-Control'] = 'no-cache';
        res.writeHead(404, headers);
        if (Meteor.isDevelopment) {
          res.end(`No client program found for the ${arch} architecture.`);
        } else {
          // Safety net, but this branch should not be possible.
          res.end('404 Not Found');
        }
        return;
      }

      // If pauseClient(arch) has been called, program.paused will be a
      // Promise that will be resolved when the program is unpaused.
      await WebApp.clientPrograms[arch].paused;

      return getBoilerplateAsync(request, arch)
        .then(({ stream, statusCode, headers: newHeaders }) => {
          if (!statusCode) {
            statusCode = res.statusCode ? res.statusCode : 200;
          }

          if (newHeaders) {
            Object.assign(headers, newHeaders);
          }

          res.writeHead(statusCode, headers);

          stream.pipe(res, {
            // End the response when the stream ends.
            end: true,
          });
        })
        .catch(error => {
          Log.error('Error running template: ' + error.stack);
          res.writeHead(500, headers);
          res.end();
        });
    }
  });

  // Return 404 by default, if no other handlers serve this URL.
  app.use(function(req, res) {
    res.writeHead(404);
    res.end();
  });

  var httpServer = createServer(app);
  var onListeningCallbacks = [];

  // After 5 seconds w/o data on a socket, kill it.  On the other hand, if
  // there's an outstanding request, give it a higher timeout instead (to avoid
  // killing long-polling requests)
  httpServer.setTimeout(SHORT_SOCKET_TIMEOUT);

  // Do this here, and then also in livedata/stream_server.js, because
  // stream_server.js kills all the current request handlers when installing its
  // own.
  httpServer.on('request', WebApp._timeoutAdjustmentRequestCallback);

  // If the client gave us a bad request, tell it instead of just closing the
  // socket. This lets load balancers in front of us differentiate between "a
  // server is randomly closing sockets for no reason" and "client sent a bad
  // request".
  //
  // This will only work on Node 6; Node 4 destroys the socket before calling
  // this event. See https://github.com/nodejs/node/pull/4557/ for details.
  httpServer.on('clientError', (err, socket) => {
    // Pre-Node-6, do nothing.
    if (socket.destroyed) {
      return;
    }

    if (err.message === 'Parse Error') {
      socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    } else {
      // For other errors, use the default behavior as if we had no clientError
      // handler.
      socket.destroy(err);
    }
  });

  const suppressErrors = function() {
    suppressExpressErrors = true;
  };

  let warnedAboutConnectUsage = false;

  // start up app
  _.extend(WebApp, {
    connectHandlers: packageAndAppHandlers,
    handlers: packageAndAppHandlers,
    rawConnectHandlers: rawExpressHandlers,
    rawHandlers: rawExpressHandlers,
    httpServer: httpServer,
    expressApp: app,
    // For testing.
    suppressConnectErrors: () => {
      if (! warnedAboutConnectUsage) {
        Meteor._debug("WebApp.suppressConnectErrors has been renamed to Meteor._suppressExpressErrors and it should be used only in tests.");
        warnedAboutConnectUsage = true;
      }
      suppressErrors();
    },
    _suppressExpressErrors: suppressErrors,
    onListening: function(f) {
      if (onListeningCallbacks) onListeningCallbacks.push(f);
      else f();
    },
    // This can be overridden by users who want to modify how listening works
    // (eg, to run a proxy like Apollo Engine Proxy in front of the server).
    startListening: function(httpServer, listenOptions, cb) {
      httpServer.listen(listenOptions, cb);
    },
  });

    /**
   * @name main
   * @locus Server
   * @summary Starts the HTTP server.
   *  If `UNIX_SOCKET_PATH` is present Meteor's HTTP server will use that socket file for inter-process communication, instead of TCP.
   * If you choose to not include webapp package in your application this method still must be defined for your Meteor application to work.
   */
  // Let the rest of the packages (and Meteor.startup hooks) insert Express
  // middlewares and update __meteor_runtime_config__, then keep going to set up
  // actually serving HTML.
  exports.main = async argv => {
    await WebAppInternals.generateBoilerplate();

    const startHttpServer = listenOptions => {
      WebApp.startListening(
        argv?.httpServer || httpServer,
        listenOptions,
        Meteor.bindEnvironment(
          () => {
            if (process.env.METEOR_PRINT_ON_LISTEN) {
              console.log('LISTENING');
            }
            const callbacks = onListeningCallbacks;
            onListeningCallbacks = null;
            callbacks?.forEach(callback => {
              callback();
            });
          },
          e => {
            console.error('Error listening:', e);
            console.error(e && e.stack);
          }
        )
      );
    };

    let localPort = process.env.PORT || 0;
    let unixSocketPath = process.env.UNIX_SOCKET_PATH;

    if (unixSocketPath) {
      if (cluster.isWorker) {
        const workerName = cluster.worker.process.env.name || cluster.worker.id;
        unixSocketPath += '.' + workerName + '.sock';
      }
      // Start the HTTP server using a socket file.
      removeExistingSocketFile(unixSocketPath);
      startHttpServer({ path: unixSocketPath });

      const unixSocketPermissions = (
        process.env.UNIX_SOCKET_PERMISSIONS || ''
      ).trim();
      if (unixSocketPermissions) {
        if (/^[0-7]{3}$/.test(unixSocketPermissions)) {
          chmodSync(unixSocketPath, parseInt(unixSocketPermissions, 8));
        } else {
          throw new Error('Invalid UNIX_SOCKET_PERMISSIONS specified');
        }
      }

      const unixSocketGroup = (process.env.UNIX_SOCKET_GROUP || '').trim();
      if (unixSocketGroup) {
        const unixSocketGroupInfo = getGroupInfo(unixSocketGroup);
        if (unixSocketGroupInfo === null) {
          throw new Error('Invalid UNIX_SOCKET_GROUP name specified');
        }
        chownSync(unixSocketPath, userInfo().uid, unixSocketGroupInfo.gid);
      }

      registerSocketFileCleanup(unixSocketPath);
    } else {
      localPort = isNaN(Number(localPort)) ? localPort : Number(localPort);
      if (/\\\\?.+\\pipe\\?.+/.test(localPort)) {
        // Start the HTTP server using Windows Server style named pipe.
        startHttpServer({ path: localPort });
      } else if (typeof localPort === 'number') {
        // Start the HTTP server using TCP.
        startHttpServer({
          port: localPort,
          host: process.env.BIND_IP || '0.0.0.0',
        });
      } else {
        throw new Error('Invalid PORT specified');
      }
    }

    return 'DAEMON';
  };
}

const isGetentAvailable = () => {
  try {
    execSync('which getent');
    return true;
  } catch {
    return false;
  }
};

const getGroupInfoUsingGetent = (groupName) => {
  try {
    const stdout = execSync(`getent group ${groupName}`, { encoding: 'utf8' });
    if (!stdout) return null;
    const [name, , gid] = stdout.trim().split(':');
    if (name == null || gid == null) return null;
    return { name, gid: Number(gid) };
  } catch (error) {
    return null;
  }
};

const getGroupInfoFromFile = (groupName) => {
  try {
    const data = readFileSync('/etc/group', 'utf8');
    const groupLine = data.trim().split('\n').find(line => line.startsWith(`${groupName}:`));
    if (!groupLine) return null;
    const [name, , gid] = groupLine.trim().split(':');
    if (name == null || gid == null) return null;
    return { name, gid: Number(gid) };
  } catch (error) {
    return null;
  }
};

export const getGroupInfo = (groupName) => {
  let groupInfo = getGroupInfoFromFile(groupName);
  if (!groupInfo && isGetentAvailable()) {
    groupInfo = getGroupInfoUsingGetent(groupName);
  }
  return groupInfo;
};

var inlineScriptsAllowed = true;

WebAppInternals.inlineScriptsAllowed = function() {
  return inlineScriptsAllowed;
};

WebAppInternals.setInlineScriptsAllowed = async function(value) {
  inlineScriptsAllowed = value;
  await WebAppInternals.generateBoilerplate();
};

var sriMode;

WebAppInternals.enableSubresourceIntegrity = async function(use_credentials = false) {
  sriMode = use_credentials ? 'use-credentials' : 'anonymous';
  await WebAppInternals.generateBoilerplate();
};

WebAppInternals.setBundledJsCssUrlRewriteHook = async function(hookFn) {
  bundledJsCssUrlRewriteHook = hookFn;
  await WebAppInternals.generateBoilerplate();
};

WebAppInternals.setBundledJsCssPrefix = async function(prefix) {
  var self = this;
  await self.setBundledJsCssUrlRewriteHook(function(url) {
    return prefix + url;
  });
};

// Packages can call `WebAppInternals.addStaticJs` to specify static
// JavaScript to be included in the app. This static JS will be inlined,
// unless inline scripts have been disabled, in which case it will be
// served under `/<sha1 of contents>`.
var additionalStaticJs = {};
WebAppInternals.addStaticJs = function(contents) {
  additionalStaticJs['/' + sha1(contents) + '.js'] = contents;
};

// Exported for tests
WebAppInternals.getBoilerplate = getBoilerplate;
WebAppInternals.additionalStaticJs = additionalStaticJs;

await runWebAppServer();
