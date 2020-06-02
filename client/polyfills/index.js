import '@rocket.chat/fuselage-polyfills';
import 'url-polyfill';
import './customEventPolyfill';
import './cssVars';

Object.fromEntries = Object.fromEntries || function fromEntries(iterable) {
	return [...iterable].reduce((obj, { 0: key, 1: val }) => Object.assign(obj, { [key]: val }), {});
};
