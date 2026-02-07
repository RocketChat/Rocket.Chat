Package["core-runtime"].queue("meteor", function () {
	var global, meteorEnv, Meteor;

	(function () {
		global = globalThis;
	}).call(this);

	(function () {
		var config = __meteor_runtime_config__;

		meteorEnv = config.meteorEnv;

		Meteor = {
			isProduction: meteorEnv.NODE_ENV === "production",
			isDevelopment: meteorEnv.NODE_ENV !== "production",
			isClient: true,
			isServer: false,
			isCordova: false,
			isModern: config.isModern
		};

		if (config.gitCommitHash) {
			Meteor.gitCommitHash = config.gitCommitHash;
		}

		if (config.PUBLIC_SETTINGS) {
			Meteor.settings = { "public": config.PUBLIC_SETTINGS };
		}
	}).call(this);

	(function () {
		if (typeof __meteor_runtime_config__ === 'object' && __meteor_runtime_config__.meteorRelease) {
			Meteor.release = __meteor_runtime_config__.meteorRelease;
		}

		Meteor._get = function (obj) {
			for (var i = 1; i < arguments.length; i++) {
				if (!(arguments[i] in obj)) return undefined;

				obj = obj[arguments[i]];
			}

			return obj;
		};

		Meteor._ensure = function (obj) {
			for (var i = 1; i < arguments.length; i++) {
				var key = arguments[i];

				if (!(key in obj)) obj[key] = {};

				obj = obj[key];
			}

			return obj;
		};

		Meteor._delete = function (obj) {
			var stack = [obj];
			var leaf = true;

			for (var i = 1; i < arguments.length - 1; i++) {
				var key = arguments[i];

				if (!(key in obj)) {
					leaf = false;

					break;
				}

				obj = obj[key];

				if (typeof obj !== "object") break;

				stack.push(obj);
			}

			for (var i = stack.length - 1; i >= 0; i--) {
				var key = arguments[i + 1];

				if (leaf) leaf = false; else for (var other in stack[i][key]) return;

				delete stack[i][key];
			}
		};

		Meteor.promisify = function (fn, context, errorFirst) {
			if (errorFirst === undefined) {
				errorFirst = true;
			}

			return function () {
				var self = this;

				var filteredArgs = Array.prototype.slice.call(arguments).filter(function (i) {
					return i !== undefined;
				});

				return new Promise(function (resolve, reject) {
					var callback = Meteor.bindEnvironment(function (error, result) {
						var _error = error, _result = result;

						if (!errorFirst) {
							_error = result;
							_result = error;
						}

						if (_error) {
							return reject(_error);
						}

						resolve(_result);
					});

					filteredArgs.push(callback);

					return fn.apply(context || self, filteredArgs);
				});
			};
		};

		Meteor.wrapAsync = function (fn, context) {
			return function () {
				var self = context || this;
				var newArgs = Array.prototype.slice.call(arguments);
				var callback;

				for (var i = newArgs.length - 1; i >= 0; --i) {
					var arg = newArgs[i];
					var type = typeof arg;

					if (type !== "undefined") {
						if (type === "function") {
							callback = arg;
						}

						break;
					}
				}

				if (!callback) {
					callback = logErr;
					++i;
				}

				newArgs[i] = Meteor.bindEnvironment(callback);

				return fn.apply(self, newArgs);
			};
		};

		Meteor.wrapFn = function (fn) {
			return fn;
		};

		var hasOwn = Object.prototype.hasOwnProperty;

		Meteor._inherits = function (Child, Parent) {
			for (var key in Parent) {
				if (hasOwn.call(Parent, key)) {
					Child[key] = Parent[key];
				}
			}

			var Middle = function () {
				this.constructor = Child;
			};

			Middle.prototype = Parent.prototype;
			Child.prototype = new Middle();
			Child.__super__ = Parent.prototype;

			return Child;
		};

		var warnedAboutWrapAsync = false;

		Meteor._wrapAsync = function (fn, context) {
			if (!warnedAboutWrapAsync) {
				Meteor._debug("Meteor._wrapAsync has been renamed to Meteor.wrapAsync");
				warnedAboutWrapAsync = true;
			}

			return Meteor.wrapAsync.apply(Meteor, arguments);
		};

		function logErr(err) {
			if (err) {
				return Meteor._debug("Exception in callback of async function", err);
			}
		}
	}).call(this);

	(function () {
		"use strict";

		var global = globalThis;

		function useSetImmediate() {
			if (!global.setImmediate) return null; else {
				var setImmediate = function (fn) {
					global.setImmediate(fn);
				};

				setImmediate.implementation = 'setImmediate';

				return setImmediate;
			}
		}

		function usePostMessage() {
			if (!global.postMessage || global.importScripts) {
				return null;
			}

			var postMessageIsAsynchronous = true;
			var oldOnMessage = global.onmessage;

			global.onmessage = function () {
				postMessageIsAsynchronous = false;
			};

			global.postMessage("", "*");
			global.onmessage = oldOnMessage;

			if (!postMessageIsAsynchronous) return null;

			var funcIndex = 0;
			var funcs = {};
			var MESSAGE_PREFIX = "Meteor._setImmediate." + Math.random() + '.';

			function isStringAndStartsWith(string, putativeStart) {
				return typeof string === "string" && string.substring(0, putativeStart.length) === putativeStart;
			}

			function onGlobalMessage(event) {
				if (event.source === global && isStringAndStartsWith(event.data, MESSAGE_PREFIX)) {
					var index = event.data.substring(MESSAGE_PREFIX.length);

					try {
						if (funcs[index]) funcs[index]();
					} finally {
						delete funcs[index];
					}
				}
			}

			if (global.addEventListener) {
				global.addEventListener("message", onGlobalMessage, false);
			} else {
				global.attachEvent("onmessage", onGlobalMessage);
			}

			var setImmediate = function (fn) {
				++funcIndex;
				funcs[funcIndex] = fn;
				global.postMessage(MESSAGE_PREFIX + funcIndex, "*");
			};

			setImmediate.implementation = 'postMessage';

			return setImmediate;
		}

		function useTimeout() {
			var setImmediate = function (fn) {
				global.setTimeout(fn, 0);
			};

			setImmediate.implementation = 'setTimeout';

			return setImmediate;
		}

		Meteor._setImmediate = useSetImmediate() || usePostMessage() || useTimeout();
	}).call(this);

	(function () {
		function withoutInvocation(f) {
			if (Package.ddp) {
				var DDP = Package.ddp.DDP;
				var CurrentInvocation = DDP._CurrentMethodInvocation || DDP._CurrentInvocation;
				var invocation = CurrentInvocation.get();

				if (invocation && invocation.isSimulation) {
					throw new Error("Can't set timers inside simulations");
				}

				return function () {
					CurrentInvocation.withValue(null, f);
				};
			} else {
				return f;
			}
		}

		function bindAndCatch(context, f) {
			return Meteor.bindEnvironment(withoutInvocation(f), context);
		}

		Meteor.setTimeout = function (f, duration) {
			return setTimeout(bindAndCatch("setTimeout callback", f), duration);
		};

		Meteor.setInterval = function (f, duration) {
			return setInterval(bindAndCatch("setInterval callback", f), duration);
		};

		Meteor.clearInterval = function (x) {
			return clearInterval(x);
		};

		Meteor.clearTimeout = function (x) {
			return clearTimeout(x);
		};

		Meteor.defer = function (f) {
			Meteor._setImmediate(bindAndCatch("defer callback", f));
		};
	}).call(this);

	(function () {
		Meteor.makeErrorType = function (name, constructor) {
			var errorClass = function () {
				if (Error.captureStackTrace) {
					Error.captureStackTrace(this, errorClass);
				} else {
					this.stack = new Error().stack;
				}

				constructor.apply(this, arguments);
				this.errorType = name;
			};

			Meteor._inherits(errorClass, Error);

			return errorClass;
		};

		Meteor.Error = Meteor.makeErrorType("Meteor.Error", function (error, reason, details) {
			var self = this;

			self.isClientSafe = true;
			self.error = error;
			self.reason = reason;
			self.details = details;

			if (self.reason) self.message = self.reason + ' [' + self.error + ']'; else self.message = '[' + self.error + ']';
		});

		Meteor.Error.prototype.clone = function () {
			var self = this;

			return new Meteor.Error(self.error, self.reason, self.details);
		};
	}).call(this);

	(function () {
		Meteor._noYieldsAllowed = function (f) {
			var result = f();

			if (Meteor._isPromise(result)) {
				throw new Error("function is a promise when calling Meteor._noYieldsAllowed");
			}

			return result;
		};

		function FakeDoubleEndedQueue() {
			this.queue = [];
		}

		FakeDoubleEndedQueue.prototype.push = function (task) {
			this.queue.push(task);
		};

		FakeDoubleEndedQueue.prototype.shift = function () {
			return this.queue.shift();
		};

		FakeDoubleEndedQueue.prototype.isEmpty = function () {
			return this.queue.length === 0;
		};

		Meteor._DoubleEndedQueue = false ? Npm.require('denque') : FakeDoubleEndedQueue;

		const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

		Meteor._sleepForMs = function (ms) {
			return _sleep(ms);
		};

		Meteor.sleep = _sleep;
	}).call(this);

	(function () {
		Meteor._noYieldsAllowed = function (f) {
			return f();
		};

		Meteor._SynchronousQueue = function () {
			var self = this;

			self._tasks = [];
			self._running = false;
			self._runTimeout = null;
		};

		var SQp = Meteor._SynchronousQueue.prototype;

		SQp.runTask = function (task) {
			var self = this;

			if (!self.safeToRunTask()) throw new Error("Could not synchronously run a task from a running task");

			self._tasks.push(task);

			var tasks = self._tasks;

			self._tasks = [];
			self._running = true;

			if (self._runTimeout) {
				clearTimeout(self._runTimeout);
				self._runTimeout = null;
			}

			try {
				while (tasks.length > 0) {
					var t = tasks.shift();

					try {
						t();
					} catch(e) {
						if (tasks.length === 0) {
							throw e;
						}

						Meteor._debug("Exception in queued task", e);
					}
				}
			} finally {
				self._running = false;
			}
		};

		SQp.queueTask = function (task) {
			var self = this;

			self._tasks.push(task);

			if (!self._runTimeout) {
				self._runTimeout = setTimeout(
					function () {
						return self.flush.apply(self, arguments);
					},
					0
				);
			}
		};

		SQp.flush = function () {
			var self = this;

			self.runTask(function () {});
		};

		SQp.drain = function () {
			var self = this;

			if (!self.safeToRunTask()) {
				return;
			}

			while (self._tasks.length > 0) {
				self.flush();
			}
		};

		SQp.safeToRunTask = function () {
			var self = this;

			return !self._running;
		};
	}).call(this);

	(function () {
		Meteor.isFibersDisabled = true;

		Meteor._isPromise = function (r) {
			return r && typeof r.then === "function";
		};

		Meteor._runFresh = function (fn) {
			return fn();
		};
	}).call(this);

	(function () {
		var callbackQueue = [];
		var isLoadingCompleted = false;
		var eagerCodeRan = false;
		var isReady = false;
		var readyHoldsCount = 0;

		var holdReady = function () {
			readyHoldsCount++;
		};

		var releaseReadyHold = function () {
			readyHoldsCount--;
			maybeReady();
		};

		var maybeReady = function () {
			if (isReady || !eagerCodeRan || readyHoldsCount > 0) return;

			isReady = true;

			while (callbackQueue.length) callbackQueue.shift()();

			if (false) {
				WebAppLocalServer.startupDidComplete();
			}
		};

		function waitForEagerAsyncModules() {
			function finish() {
				eagerCodeRan = true;
				maybeReady();
			}

			var potentialPromise = Package['core-runtime'].waitUntilAllLoaded();

			if (potentialPromise === null) {
				finish();
			} else {
				potentialPromise.then(function () {
					finish();
				});
			}
		}

		var loadingCompleted = function () {
			if (isLoadingCompleted) {
				return;
			}

			isLoadingCompleted = true;
			waitForEagerAsyncModules();
		};

		if (false) {
			holdReady();
			document.addEventListener('deviceready', releaseReadyHold, false);
		}

		if (document.readyState === 'complete' || document.readyState === 'loaded') {
			window.setTimeout(loadingCompleted);
		} else {
			if (document.addEventListener) {
				document.addEventListener('DOMContentLoaded', loadingCompleted, false);
				window.addEventListener('load', loadingCompleted, false);
			} else {
				document.attachEvent('onreadystatechange', function () {
					if (document.readyState === "complete") {
						loadingCompleted();
					}
				});

				window.attachEvent('load', loadingCompleted);
			}
		}

		Meteor.startup = function (callback) {
			var doScroll = !document.addEventListener && document.documentElement.doScroll;

			if (!doScroll || window !== top) {
				if (isReady) callback(); else callbackQueue.push(callback);
			} else {
				try {
					doScroll('left');
				} catch(error) {
					setTimeout(
						function () {
							Meteor.startup(callback);
						},
						50
					);

					return;
				}

				callback();
			}
		};
	}).call(this);

	(function () {
		if (false) {
			if (typeof __meteor_runtime_config__ === 'object') {
				__meteor_runtime_config__.debug = !!process.env.NODE_INSPECTOR_IPC || !!process.env.VSCODE_INSPECTOR_OPTIONS || process.execArgv.some(function (_arg) {
					return (/^--(inspect|debug)(-brk)?(=\d+)?$/i).test(_arg);
				});
			}
		}

		Meteor.isDebug = true
			? typeof window === 'object' && !!window.__meteor_runtime_config__.debug
			: typeof __meteor_runtime_config__ === 'object' && !!__meteor_runtime_config__.debug;

		var suppress = 0;

		Meteor._debug = function () {
			if (suppress) {
				suppress--;

				return;
			}

			if (typeof console !== 'undefined' && typeof console.log !== 'undefined') {
				if (arguments.length == 0) {
					console.log('');
				} else {
					if (typeof console.log.apply === "function") {
						var allArgumentsOfTypeString = true;

						for (var i = 0; i < arguments.length; i++) if (typeof arguments[i] !== "string") allArgumentsOfTypeString = false;

						if (allArgumentsOfTypeString) console.log.apply(console, [Array.prototype.join.call(arguments, " ")]); else console.log.apply(console, arguments);
					} else if (typeof Function.prototype.bind === "function") {
						var log = Function.prototype.bind.call(console.log, console);

						log.apply(console, arguments);
					}
				}
			}
		};

		Meteor._suppress_log = function (count) {
			suppress += count;
		};

		Meteor._suppressed_log_expected = function () {
			return suppress !== 0;
		};
	}).call(this);

	(function () {
		if (false && true) {
			if (typeof __meteor_runtime_config__ === 'object') {
				var noDeprecation = process.env.METEOR_NO_DEPRECATION || process.noDeprecation;

				if (noDeprecation === 'true' || noDeprecation === 'false') {
					noDeprecation = noDeprecation === 'true';
				}

				__meteor_runtime_config__.noDeprecation = noDeprecation;
			}
		}

		function oncePerArgument(func) {
			var cache = new Map();

			return function _oncePerArgument() {
				var key = JSON.stringify(arguments);

				if (!cache.has(key)) {
					var result = func.apply(this, arguments);

					cache.set(key, result);
				}

				return cache.get(key);
			};
		}

		function cleanStackTrace(stackTrace) {
			if (!stackTrace || typeof stackTrace !== 'string') return [];

			var lines = stackTrace.split('\n');
			var trace = [];

			try {
				for (var i = 0; i < lines.length; i++) {
					var _line = lines[i].trim();

					if (_line.indexOf('Meteor.deprecate') !== -1) continue;

					if (_line.indexOf('packages/') !== -1) {
						trace.push(_line);
					} else if (_line && _line.indexOf('/') !== -1) {
						trace.push(_line);

						break;
					}
				}
			} catch(e) {
				console.error('Error cleaning stack trace: ', e);
			}

			return trace.join('\n');
		}

		var onceWarning = oncePerArgument(function _onceWarning(message) {
			console.warn.apply(console, message);
		});

		function onceFixDeprecation() {
			onceWarning([
				'Deprecation warnings are hidden but crucial to address for future Meteor updates.',
				'\n',
				'Remove the `METEOR_NO_DEPRECATION` env var to reveal them, then report or fix the issues.'
			]);
		}

		Meteor.deprecate = function () {
			if (!true) {
				return;
			}

			if (typeof console !== 'undefined' && typeof console.warn !== 'undefined') {
				var stackStrace = cleanStackTrace(new Error().stack || '');
				var messages = Array.prototype.slice.call(arguments);

				if (typeof __meteor_runtime_config__.noDeprecation === 'string') {
					var noDeprecationPattern = new RegExp(__meteor_runtime_config__.noDeprecation);

					if (noDeprecationPattern.test(stackStrace)) {
						onceFixDeprecation();

						return;
					}
				} else if (typeof __meteor_runtime_config__.noDeprecation === 'boolean' && __meteor_runtime_config__.noDeprecation) {
					onceFixDeprecation();

					return;
				}

				if (stackStrace.length > 0) {
					messages.push('\n\n', 'Trace:', '\n', stackStrace);
				}

				messages.push('\n\n', 'To disable warnings, set the `METEOR_NO_DEPRECATION` to `true` or a regex pattern.', '\n');
				onceWarning(['[DEPRECATION]'].concat(messages));
			}
		};
	}).call(this);

	(function () {
		Meteor._escapeRegExp = function (string) {
			return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		};
	}).call(this);

	(function () {
		var TEST_METADATA_STR;

		if (true) {
			TEST_METADATA_STR = meteorEnv.TEST_METADATA;
		} else {
			TEST_METADATA_STR = process.env.TEST_METADATA;
		}

		var TEST_METADATA = JSON.parse(TEST_METADATA_STR || "{}");
		var testDriverPackageName = false;

		Meteor.isTest = !!TEST_METADATA.isTest;
		Meteor.isAppTest = !!TEST_METADATA.isAppTest;
		Meteor.isPackageTest = !!testDriverPackageName && !false && !false;

		if (typeof testDriverPackageName === "string") {
			Meteor.startup(function () {
				var testDriverPackage = Package[testDriverPackageName];

				if (!testDriverPackage) {
					throw new Error("Can't find test driver package: " + testDriverPackageName);
				}

				if (true) {
					if (typeof testDriverPackage.runTests !== "function") {
						throw new Error("Test driver package " + testDriverPackageName + " missing `runTests` export");
					}

					testDriverPackage.runTests();
				} else {
					if (typeof testDriverPackage.start === "function") {
						testDriverPackage.start();
					}
				}
			});
		}
	}).call(this);

	(function () {
		var nextSlot = 0;
		var currentValues = [];
		var callAsyncMethodRunning = false;

		Meteor.EnvironmentVariable = function () {
			this.slot = nextSlot++;
		};

		var EVp = Meteor.EnvironmentVariable.prototype;

		EVp.getCurrentValues = function () {
			return currentValues;
		};

		EVp.get = function () {
			return currentValues[this.slot];
		};

		EVp.getOrNullIfOutsideFiber = function () {
			return this.get();
		};

		EVp.withValue = function (value, func) {
			var saved = currentValues[this.slot];

			try {
				currentValues[this.slot] = value;

				return func();
			} finally {
				currentValues[this.slot] = saved;
			}
		};

		EVp._set = function (context) {
			currentValues[this.slot] = context;
		};

		EVp._setNewContextAndGetCurrent = function (value) {
			var saved = currentValues[this.slot];

			this._set(value);

			return saved;
		};

		EVp._isCallAsyncMethodRunning = function () {
			return callAsyncMethodRunning;
		};

		EVp._setCallAsyncMethodRunning = function (value) {
			callAsyncMethodRunning = value;
		};

		Meteor.bindEnvironment = function (func, onException, _this) {
			var boundValues = currentValues.slice();

			if (!onException || typeof onException === 'string') {
				var description = onException || "callback of async function";

				onException = function (error) {
					Meteor._debug("Exception in " + description + ":", error);
				};
			}

			return function () {
				var savedValues = currentValues;

				try {
					currentValues = boundValues;

					var ret = func.apply(_this, arguments);
				} catch(e) {
					onException(e);
				} finally {
					currentValues = savedValues;
				}

				return ret;
			};
		};
	}).call(this);

	(function () {
		Meteor.absoluteUrl = function (path, options) {
			if (!options && typeof path === 'object') {
				options = path;
				path = undefined;
			}

			options = Object.assign({}, Meteor.absoluteUrl.defaultOptions, options || {});

			var url = options.rootUrl;

			if (!url) throw new Error("Must pass options.rootUrl or set ROOT_URL in the server environment");
			if (!(/^http[s]?:\/\//i).test(url)) url = 'http://' + url;

			if (!url.endsWith("/")) {
				url += "/";
			}

			if (path) {
				while (path.startsWith("/")) {
					path = path.slice(1);
				}

				url += path;
			}

			if (options.secure && (/^http:/).test(url) && !(/http:\/\/localhost[:\/]/).test(url) && !(/http:\/\/127\.0\.0\.1[:\/]/).test(url)) url = url.replace(/^http:/, 'https:');

			if (options.replaceLocalhost) {
				url = url.replace(/^http:\/\/localhost([:\/].*)/, 'http://127.0.0.1$1');
			}

			return url;
		};

		var defaultOptions = Meteor.absoluteUrl.defaultOptions = {};
		var location = typeof window === "object" && window.location;

		if (typeof __meteor_runtime_config__ === "object" && __meteor_runtime_config__.ROOT_URL) {
			defaultOptions.rootUrl = __meteor_runtime_config__.ROOT_URL;
		} else if (location && location.protocol && location.host) {
			defaultOptions.rootUrl = location.protocol + "//" + location.host;
		}

		if (location && location.protocol === "https:") {
			defaultOptions.secure = true;
		}

		Meteor._relativeToSiteRootUrl = function (link) {
			if (typeof __meteor_runtime_config__ === "object" && link.substr(0, 1) === "/") link = (__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || "") + link;

			return link;
		};
	}).call(this);

	return {
		export() {
			return { Meteor, global, meteorEnv };
		}
	};
});
export const { Meteor, global, meteorEnv } = Package['meteor'];