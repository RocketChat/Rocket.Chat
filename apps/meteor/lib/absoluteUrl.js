/* 
	This override is necessary since Meteor is always replacing "localhost" by "127.0.0.1", it does not matter what you provide as replaceLocalhost flag
	See: https://github.com/meteor/meteor/blob/611e14f2045daaab3062abdcbade6734a66e3684/packages/meteor/url_common.js#L47 (temporary link)
*/
import { Meteor } from 'meteor/meteor';

const originalFn = Meteor.absoluteUrl;
const originalDefaultOptions = Meteor.absoluteUrl.defaultOptions;

Meteor.absoluteUrl = function (...args) {
	const url = originalFn.apply(this, args);
	if (Meteor.absoluteUrl.defaultOptions.rootUrl?.includes('localhost') && url.includes('127.0.0.1')) {
		return url.replace(/^http:\/\/127.0.0.1([:\/].*)/, 'http://localhost$1');
	}
	return url;
};

Meteor.absoluteUrl.defaultOptions = originalDefaultOptions;
