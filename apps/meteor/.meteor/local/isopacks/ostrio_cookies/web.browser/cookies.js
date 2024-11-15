import { Meteor } from 'meteor/meteor';

let fetch;
let WebApp;

if (Meteor.isServer) {
	WebApp = require('meteor/webapp').WebApp;
} else {
	fetch = require('meteor/fetch').fetch;
}

const NoOp = () => {};
const urlRE = /\/___cookie___\/set/;
const rootUrl = Meteor.isServer
	? process.env.ROOT_URL
	: window.__meteor_runtime_config__.ROOT_URL || window.__meteor_runtime_config__.meteorEnv.ROOT_URL || false;
const mobileRootUrl = Meteor.isServer
	? process.env.MOBILE_ROOT_URL
	: window.__meteor_runtime_config__.MOBILE_ROOT_URL || window.__meteor_runtime_config__.meteorEnv.MOBILE_ROOT_URL || false;

const helpers = {
	isUndefined(obj) {
		return obj === void 0;
	},
	isArray(obj) {
		return Array.isArray(obj);
	},
	clone(obj) {
		if (!this.isObject(obj)) return obj;
		return this.isArray(obj) ? obj.slice() : Object.assign({}, obj);
	},
};
const _helpers = ['Number', 'Object', 'Function'];
for (let i = 0; i < _helpers.length; i++) {
	helpers['is' + _helpers[i]] = function (obj) {
		return Object.prototype.toString.call(obj) === '[object ' + _helpers[i] + ']';
	};
}

/**
 * @url https://github.com/jshttp/cookie/blob/master/index.js
 * @name cookie
 * @author jshttp
 * @license
 * (The MIT License)
 *
 * Copyright (c) 2012-2014 Roman Shtylman <shtylman@gmail.com>
 * Copyright (c) 2015 Douglas Christopher Wilson <doug@somethingdoug.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
const decode = decodeURIComponent;
const encode = encodeURIComponent;
const pairSplitRegExp = /; */;

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */
const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

/**
 * @function
 * @name tryDecode
 * @param {String} str
 * @param {Function} d
 * @summary Try decoding a string using a decoding function.
 * @private
 */
const tryDecode = (str, d) => {
	try {
		return d(str);
	} catch (e) {
		return str;
	}
};

/**
 * @function
 * @name parse
 * @param {String} str
 * @param {Object} [options]
 * @return {Object}
 * @summary
 * Parse a cookie header.
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 * @private
 */
const parse = (str, options) => {
	if (typeof str !== 'string') {
		throw new Meteor.Error(404, 'argument str must be a string');
	}
	const obj = {};
	const opt = options || {};
	let val;
	let key;
	let eqIndx;

	str.split(pairSplitRegExp).forEach((pair) => {
		eqIndx = pair.indexOf('=');
		if (eqIndx < 0) {
			return;
		}
		key = pair.substr(0, eqIndx).trim();
		key = tryDecode(unescape(key), opt.decode || decode);
		val = pair.substr(++eqIndx, pair.length).trim();
		if (val[0] === '"') {
			val = val.slice(1, -1);
		}
		if (void 0 === obj[key]) {
			obj[key] = tryDecode(val, opt.decode || decode);
		}
	});
	return obj;
};

/**
 * @function
 * @name antiCircular
 * @param data {Object} - Circular or any other object which needs to be non-circular
 * @private
 */
const antiCircular = (_obj) => {
	const object = helpers.clone(_obj);
	const cache = new Map();
	return JSON.stringify(object, (key, value) => {
		if (typeof value === 'object' && value !== null) {
			if (cache.get(value)) {
				return void 0;
			}
			cache.set(value, true);
		}
		return value;
	});
};

/**
 * @function
 * @name serialize
 * @param {String} name
 * @param {String} val
 * @param {Object} [options]
 * @return { cookieString: String, sanitizedValue: Mixed }
 * @summary
 * Serialize data into a cookie header.
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 * serialize('foo', 'bar', { httpOnly: true }) => "foo=bar; httpOnly"
 * @private
 */
const serialize = (key, val, opt = {}) => {
	let name;

	if (!fieldContentRegExp.test(key)) {
		name = escape(key);
	} else {
		name = key;
	}

	let sanitizedValue = val;
	let value = val;
	if (!helpers.isUndefined(value)) {
		if (helpers.isObject(value) || helpers.isArray(value)) {
			const stringified = antiCircular(value);
			value = encode(`JSON.parse(${stringified})`);
			sanitizedValue = JSON.parse(stringified);
		} else {
			value = encode(value);
			if (value && !fieldContentRegExp.test(value)) {
				value = escape(value);
			}
		}
	} else {
		value = '';
	}

	const pairs = [`${name}=${value}`];

	if (helpers.isNumber(opt.maxAge)) {
		pairs.push(`Max-Age=${opt.maxAge}`);
	}

	if (opt.domain && typeof opt.domain === 'string') {
		if (!fieldContentRegExp.test(opt.domain)) {
			throw new Meteor.Error(404, 'option domain is invalid');
		}
		pairs.push(`Domain=${opt.domain}`);
	}

	if (opt.path && typeof opt.path === 'string') {
		if (!fieldContentRegExp.test(opt.path)) {
			throw new Meteor.Error(404, 'option path is invalid');
		}
		pairs.push(`Path=${opt.path}`);
	} else {
		pairs.push('Path=/');
	}

	opt.expires = opt.expires || opt.expire || false;
	if (opt.expires === Infinity) {
		pairs.push('Expires=Fri, 31 Dec 9999 23:59:59 GMT');
	} else if (opt.expires instanceof Date) {
		pairs.push(`Expires=${opt.expires.toUTCString()}`);
	} else if (opt.expires === 0) {
		pairs.push('Expires=0');
	} else if (helpers.isNumber(opt.expires)) {
		pairs.push(`Expires=${new Date(opt.expires).toUTCString()}`);
	}

	if (opt.httpOnly) {
		pairs.push('HttpOnly');
	}

	if (opt.secure) {
		pairs.push('Secure');
	}

	if (opt.firstPartyOnly) {
		pairs.push('First-Party-Only');
	}

	if (opt.sameSite) {
		pairs.push(opt.sameSite === true ? 'SameSite' : `SameSite=${opt.sameSite}`);
	}

	return { cookieString: pairs.join('; '), sanitizedValue };
};

const isStringifiedRegEx = /JSON\.parse\((.*)\)/;
const isTypedRegEx = /false|true|null/;
const deserialize = (string) => {
	if (typeof string !== 'string') {
		return string;
	}

	if (isStringifiedRegEx.test(string)) {
		let obj = string.match(isStringifiedRegEx)[1];
		if (obj) {
			try {
				return JSON.parse(decode(obj));
			} catch (e) {
				console.error('[ostrio:cookies] [.get()] [deserialize()] Exception:', e, string, obj);
				return string;
			}
		}
		return string;
	} else if (isTypedRegEx.test(string)) {
		try {
			return JSON.parse(string);
		} catch (e) {
			return string;
		}
	}
	return string;
};

/**
 * @locus Anywhere
 * @class __cookies
 * @param opts {Object} - Options (configuration) object
 * @param opts._cookies {Object|String} - Current cookies as String or Object
 * @param opts.TTL {Number|Boolean} - Default cookies expiration time (max-age) in milliseconds, by default - session (false)
 * @param opts.runOnServer {Boolean} - Expose Cookies class to Server
 * @param opts.response {http.ServerResponse|Object} - This object is created internally by a HTTP server
 * @param opts.allowQueryStringCookies {Boolean} - Allow passing Cookies in a query string (in URL). Primary should be used only in Cordova environment
 * @param opts.allowedCordovaOrigins {Regex|Boolean} - [Server] Allow setting Cookies from that specific origin which in Meteor/Cordova is localhost:12XXX (^http://localhost:12[0-9]{3}$)
 * @summary Internal Class
 */
class __cookies {
	constructor(opts) {
		this.__pendingCookies = [];
		this.TTL = opts.TTL || false;
		this.response = opts.response || false;
		this.runOnServer = opts.runOnServer || false;
		this.allowQueryStringCookies = opts.allowQueryStringCookies || false;
		this.allowedCordovaOrigins = opts.allowedCordovaOrigins || false;

		if (this.allowedCordovaOrigins === true) {
			this.allowedCordovaOrigins = /^http:\/\/localhost:12[0-9]{3}$/;
		}

		this.originRE = new RegExp(`^https?:\/\/(${rootUrl ? rootUrl : ''}${mobileRootUrl ? '|' + mobileRootUrl : ''})$`);

		if (helpers.isObject(opts._cookies)) {
			this.cookies = opts._cookies;
		} else {
			this.cookies = parse(opts._cookies);
		}
	}

	/**
	 * @locus Anywhere
	 * @memberOf __cookies
	 * @name get
	 * @param {String} key  - The name of the cookie to read
	 * @param {String} _tmp - Unparsed string instead of user's cookies
	 * @summary Read a cookie. If the cookie doesn't exist a null value will be returned.
	 * @returns {String|void}
	 */
	get(key, _tmp) {
		const cookieString = _tmp ? parse(_tmp) : this.cookies;
		if (!key || !cookieString) {
			return void 0;
		}

		if (cookieString.hasOwnProperty(key)) {
			return deserialize(cookieString[key]);
		}

		return void 0;
	}

	/**
	 * @locus Anywhere
	 * @memberOf __cookies
	 * @name set
	 * @param {String} key   - The name of the cookie to create/overwrite
	 * @param {String} value - The value of the cookie
	 * @param {Object} opts  - [Optional] Cookie options (see readme docs)
	 * @summary Create/overwrite a cookie.
	 * @returns {Boolean}
	 */
	set(key, value, opts = {}) {
		if (key && !helpers.isUndefined(value)) {
			if (helpers.isNumber(this.TTL) && opts.expires === undefined) {
				opts.expires = new Date(+new Date() + this.TTL);
			}
			const { cookieString, sanitizedValue } = serialize(key, value, opts);

			this.cookies[key] = sanitizedValue;
			if (Meteor.isClient) {
				document.cookie = cookieString;
			} else if (this.response) {
				this.__pendingCookies.push(cookieString);
				this.response.setHeader('Set-Cookie', this.__pendingCookies);
			}
			return true;
		}
		return false;
	}

	/**
	 * @locus Anywhere
	 * @memberOf __cookies
	 * @name remove
	 * @param {String} key    - The name of the cookie to create/overwrite
	 * @param {String} path   - [Optional] The path from where the cookie will be
	 * readable. E.g., "/", "/mydir"; if not specified, defaults to the current
	 * path of the current document location (string or null). The path must be
	 * absolute (see RFC 2965). For more information on how to use relative paths
	 * in this argument, see: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie#Using_relative_URLs_in_the_path_parameter
	 * @param {String} domain - [Optional] The domain from where the cookie will
	 * be readable. E.g., "example.com", ".example.com" (includes all subdomains)
	 * or "subdomain.example.com"; if not specified, defaults to the host portion
	 * of the current document location (string or null).
	 * @summary Remove a cookie(s).
	 * @returns {Boolean}
	 */
	remove(key, path = '/', domain = '') {
		if (key && this.cookies.hasOwnProperty(key)) {
			const { cookieString } = serialize(key, '', {
				domain,
				path,
				expires: new Date(0),
			});

			delete this.cookies[key];
			if (Meteor.isClient) {
				document.cookie = cookieString;
			} else if (this.response) {
				this.response.setHeader('Set-Cookie', cookieString);
			}
			return true;
		} else if (!key && this.keys().length > 0 && this.keys()[0] !== '') {
			const keys = Object.keys(this.cookies);
			for (let i = 0; i < keys.length; i++) {
				this.remove(keys[i]);
			}
			return true;
		}
		return false;
	}

	/**
	 * @locus Anywhere
	 * @memberOf __cookies
	 * @name has
	 * @param {String} key  - The name of the cookie to create/overwrite
	 * @param {String} _tmp - Unparsed string instead of user's cookies
	 * @summary Check whether a cookie exists in the current position.
	 * @returns {Boolean}
	 */
	has(key, _tmp) {
		const cookieString = _tmp ? parse(_tmp) : this.cookies;
		if (!key || !cookieString) {
			return false;
		}

		return cookieString.hasOwnProperty(key);
	}

	/**
	 * @locus Anywhere
	 * @memberOf __cookies
	 * @name keys
	 * @summary Returns an array of all readable cookies from this location.
	 * @returns {[String]}
	 */
	keys() {
		if (this.cookies) {
			return Object.keys(this.cookies);
		}
		return [];
	}

	/**
	 * @locus Client
	 * @memberOf __cookies
	 * @name send
	 * @param cb {Function} - Callback
	 * @summary Send all cookies over XHR to server.
	 * @returns {void}
	 */
	send(cb = NoOp) {
		if (Meteor.isServer) {
			cb(new Meteor.Error(400, "Can't run `.send()` on server, it's Client only method!"));
		}

		if (this.runOnServer) {
			let path = `${
				window.__meteor_runtime_config__.ROOT_URL_PATH_PREFIX || window.__meteor_runtime_config__.meteorEnv.ROOT_URL_PATH_PREFIX || ''
			}/___cookie___/set`;
			let query = '';

			if (Meteor.isCordova && this.allowQueryStringCookies) {
				const cookiesKeys = this.keys();
				const cookiesArray = [];
				for (let i = 0; i < cookiesKeys.length; i++) {
					const { sanitizedValue } = serialize(cookiesKeys[i], this.get(cookiesKeys[i]));
					const pair = `${cookiesKeys[i]}=${sanitizedValue}`;
					if (!cookiesArray.includes(pair)) {
						cookiesArray.push(pair);
					}
				}

				if (cookiesArray.length) {
					path = Meteor.absoluteUrl('___cookie___/set');
					query = `?___cookies___=${encodeURIComponent(cookiesArray.join('; '))}`;
				}
			}

			fetch(`${path}${query}`, {
				credentials: 'include',
				type: 'cors',
			})
				.then((response) => {
					cb(void 0, response);
				})
				.catch(cb);
		} else {
			cb(new Meteor.Error(400, "Can't send cookies on server when `runOnServer` is false."));
		}
		return void 0;
	}
}

/**
 * @function
 * @locus Server
 * @summary Middleware handler
 * @private
 */
const __middlewareHandler = (request, response, opts) => {
	let _cookies = {};
	if (opts.runOnServer) {
		if (request.headers && request.headers.cookie) {
			_cookies = parse(request.headers.cookie);
		}

		return new __cookies({
			_cookies,
			TTL: opts.TTL,
			runOnServer: opts.runOnServer,
			response,
			allowQueryStringCookies: opts.allowQueryStringCookies,
		});
	}

	throw new Meteor.Error(400, "Can't use middleware when `runOnServer` is false.");
};

/**
 * @locus Anywhere
 * @class Cookies
 * @param opts {Object}
 * @param opts.TTL {Number} - Default cookies expiration time (max-age) in milliseconds, by default - session (false)
 * @param opts.auto {Boolean} - [Server] Auto-bind in middleware as `req.Cookies`, by default `true`
 * @param opts.handler {Function} - [Server] Middleware handler
 * @param opts.runOnServer {Boolean} - Expose Cookies class to Server
 * @param opts.allowQueryStringCookies {Boolean} - Allow passing Cookies in a query string (in URL). Primary should be used only in Cordova environment
 * @param opts.allowedCordovaOrigins {Regex|Boolean} - [Server] Allow setting Cookies from that specific origin which in Meteor/Cordova is localhost:12XXX (^http://localhost:12[0-9]{3}$)
 * @summary Main Cookie class
 */
class Cookies extends __cookies {
	constructor(opts = {}) {
		opts.TTL = helpers.isNumber(opts.TTL) ? opts.TTL : false;
		opts.runOnServer = opts.runOnServer !== false ? true : false;
		opts.allowQueryStringCookies = opts.allowQueryStringCookies !== true ? false : true;

		if (Meteor.isClient) {
			opts._cookies = document.cookie;
			super(opts);
		} else {
			opts._cookies = {};
			super(opts);
			opts.auto = opts.auto !== false ? true : false;
			this.opts = opts;
			this.handler = helpers.isFunction(opts.handler) ? opts.handler : false;
			this.onCookies = helpers.isFunction(opts.onCookies) ? opts.onCookies : false;

			if (opts.runOnServer && !Cookies.isLoadedOnServer) {
				Cookies.isLoadedOnServer = true;
				if (opts.auto) {
					WebApp.connectHandlers.use((req, res, next) => {
						if (urlRE.test(req._parsedUrl.path)) {
							const matchedCordovaOrigin =
								!!req.headers.origin && this.allowedCordovaOrigins && this.allowedCordovaOrigins.test(req.headers.origin);
							const matchedOrigin = matchedCordovaOrigin || (!!req.headers.origin && this.originRE.test(req.headers.origin));

							if (matchedOrigin) {
								res.setHeader('Access-Control-Allow-Credentials', 'true');
								res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
							}

							const cookiesArray = [];
							let cookiesObject = {};
							if (matchedCordovaOrigin && opts.allowQueryStringCookies && req.query.___cookies___) {
								cookiesObject = parse(decodeURIComponent(req.query.___cookies___));
							} else if (req.headers.cookie) {
								cookiesObject = parse(req.headers.cookie);
							}

							const cookiesKeys = Object.keys(cookiesObject);
							if (cookiesKeys.length) {
								for (let i = 0; i < cookiesKeys.length; i++) {
									const { cookieString } = serialize(cookiesKeys[i], cookiesObject[cookiesKeys[i]]);
									if (!cookiesArray.includes(cookieString)) {
										cookiesArray.push(cookieString);
									}
								}

								if (cookiesArray.length) {
									res.setHeader('Set-Cookie', cookiesArray);
								}
							}

							helpers.isFunction(this.onCookies) && this.onCookies(__middlewareHandler(req, res, opts));

							res.writeHead(200);
							res.end('');
						} else {
							req.Cookies = __middlewareHandler(req, res, opts);
							helpers.isFunction(this.handler) && this.handler(req.Cookies);
							next();
						}
					});
				}
			}
		}
	}

	/**
	 * @locus Server
	 * @memberOf Cookies
	 * @name middleware
	 * @summary Get Cookies instance into callback
	 * @returns {void}
	 */
	middleware() {
		if (!Meteor.isServer) {
			throw new Meteor.Error(500, "[ostrio:cookies] Can't use `.middleware()` on Client, it's Server only!");
		}

		return (req, res, next) => {
			helpers.isFunction(this.handler) && this.handler(__middlewareHandler(req, res, this.opts));
			next();
		};
	}
}

if (Meteor.isServer) {
	Cookies.isLoadedOnServer = false;
}

/* Export the Cookies class */
export { Cookies };
