import '@rocket.chat/fuselage-polyfills';
import 'url-polyfill';
import './customEventPolyfill';
import './cssVars';

Object.fromEntries = Object.fromEntries || function fromEntries(iterable) {
	return [...iterable].reduce((obj, { 0: key, 1: val }) => Object.assign(obj, { [key]: val }), {});
};
(function(arr) {
	arr.forEach(function(item) {
		if (item.hasOwnProperty('remove')) {
			return;
		}
		Object.defineProperty(item, 'remove', {
			configurable: true,
			enumerable: true,
			writable: true,
			value: function remove() {
				this.parentNode.removeChild(this);
			},
		});
	});
}([Element.prototype, CharacterData.prototype, DocumentType.prototype]));
