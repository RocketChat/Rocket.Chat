/* eslint-disable */
import crypto from 'crypto';
import { SystemLogger } from '../../../server/lib/logger/system';

var BigBlueButtonApi, filterCustomParameters, include, noChecksumMethods,
	__indexOf = [].indexOf || function (item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

BigBlueButtonApi = (function () {
	function BigBlueButtonApi(url, salt, debug, opts) {
		var _base;
		if (opts == null) {
			opts = {};
		}
		this.url = url;
		this.salt = salt;
		this.opts = opts;
		if ((_base = this.opts).shaType == null) {
			_base.shaType = 'sha1';
		}
	}

	BigBlueButtonApi.prototype.availableApiCalls = function () {
		return ['/', 'create', 'join', 'isMeetingRunning', 'getMeetingInfo', 'end', 'getMeetings', 'getDefaultConfigXML', 'setConfigXML', 'enter', 'configXML', 'signOut', 'getRecordings', 'publishRecordings', 'deleteRecordings', 'updateRecordings', 'hooks/create'];
	};

	BigBlueButtonApi.prototype.urlParamsFor = function (param) {
		switch (param) {
			case "create":
				return [["meetingID", true], ["name", true], ["attendeePW", false], ["moderatorPW", false], ["welcome", false], ["dialNumber", false], ["voiceBridge", false], ["webVoice", false], ["logoutURL", false], ["maxParticipants", false], ["record", false], ["duration", false], ["moderatorOnlyMessage", false], ["autoStartRecording", false], ["allowStartStopRecording", false], [/meta_\w+/, false]];
			case "join":
				return [["fullName", true], ["meetingID", true], ["password", true], ["createTime", false], ["userID", false], ["webVoiceConf", false], ["configToken", false], ["avatarURL", false], ["redirect", false], ["clientURL", false]];
			case "isMeetingRunning":
				return [["meetingID", true]];
			case "end":
				return [["meetingID", true], ["password", true]];
			case "getMeetingInfo":
				return [["meetingID", true], ["password", true]];
			case "getRecordings":
				return [["meetingID", false], ["recordID", false], ["state", false], [/meta_\w+/, false]];
			case "publishRecordings":
				return [["recordID", true], ["publish", true]];
			case "deleteRecordings":
				return [["recordID", true]];
			case "updateRecordings":
				return [["recordID", true], [/meta_\w+/, false]];
			case "hooks/create":
				return [["callbackURL", false], ["meetingID", false]];
		}
	};

	BigBlueButtonApi.prototype.filterParams = function (params, method) {
		var filters, r;
		filters = this.urlParamsFor(method);
		if ((filters == null) || filters.length === 0) {
			({});
		} else {
			r = include(params, function (key, value) {
				var filter, _i, _len;
				for (_i = 0, _len = filters.length; _i < _len; _i++) {
					filter = filters[_i];
					if (filter[0] instanceof RegExp) {
						if (key.match(filter[0]) || key.match(/^custom_/)) {
							return true;
						}
					} else {
						if (key.match("^" + filter[0] + "$") || key.match(/^custom_/)) {
							return true;
						}
					}
				}
				return false;
			});
		}
		return filterCustomParameters(r);
	};

	BigBlueButtonApi.prototype.urlFor = function (method, params, filter) {
		var checksum, key, keys, param, paramList, property, query, sep, url, _i, _len;
		if (filter == null) {
			filter = true;
		}
		SystemLogger.debug("Generating URL for", method);
		if (filter) {
			params = this.filterParams(params, method);
		} else {
			params = filterCustomParameters(params);
		}
		url = this.url;
		paramList = [];
		if (params != null) {
			keys = [];
			for (property in params) {
				keys.push(property);
			}
			keys = keys.sort();
			for (_i = 0, _len = keys.length; _i < _len; _i++) {
				key = keys[_i];
				if (key != null) {
					param = params[key];
				}
				if (param != null) {
					paramList.push("" + (this.encodeForUrl(key)) + "=" + (this.encodeForUrl(param)));
				}
			}
			if (paramList.length > 0) {
				query = paramList.join("&");
			}
		} else {
			query = '';
		}
		checksum = this.checksum(method, query);
		if (paramList.length > 0) {
			query = "" + method + "?" + query;
			sep = '&';
		} else {
			if (method !== '/') {
				query = method;
			}
			sep = '?';
		}
		if (__indexOf.call(noChecksumMethods(), method) < 0) {
			query = "" + query + sep + "checksum=" + checksum;
		}
		return "" + url + "/" + query;
	};

	BigBlueButtonApi.prototype.checksum = function (method, query) {
		var c, shaObj, str;
		query || (query = "");
		SystemLogger.debug("- Calculating the checksum using: '" + method + "', '" + query + "', '" + this.salt + "'");
		str = method + query + this.salt;
		if (this.opts.shaType === 'sha256') {
			shaObj = crypto.createHash('sha256', "TEXT")
		} else {
			shaObj = crypto.createHash('sha1', "TEXT")
		}
		shaObj.update(str);
		c = shaObj.digest('hex');
		SystemLogger.debug("- Checksum calculated:", c);
		return c;
	};

	BigBlueButtonApi.prototype.encodeForUrl = function (value) {
		return encodeURIComponent(value).replace(/%20/g, '+').replace(/[!'()]/g, escape).replace(/\*/g, "%2A");
	};

	BigBlueButtonApi.prototype.setMobileProtocol = function (url) {
		return url.replace(/http[s]?\:\/\//, "bigbluebutton://");
	};

	return BigBlueButtonApi;

})();

include = function (input, _function) {
	var key, value, _match, _obj;
	_obj = new Object;
	_match = null;
	for (key in input) {
		value = input[key];
		if (_function.call(input, key, value)) {
			_obj[key] = value;
		}
	}
	return _obj;
};

export default BigBlueButtonApi;

filterCustomParameters = function (params) {
	var key, v;
	for (key in params) {
		v = params[key];
		if (key.match(/^custom_/)) {
			params[key.replace(/^custom_/, "")] = v;
		}
	}
	for (key in params) {
		if (key.match(/^custom_/)) {
			delete params[key];
		}
	}
	return params;
};

noChecksumMethods = function () {
	return ['setConfigXML', '/', 'enter', 'configXML', 'signOut'];
};
