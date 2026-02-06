import { Meteor } from 'meteor/meteor';

Object.defineProperty(Meteor, '_localStorage', {
	value: window.localStorage,
	writable: false,
	configurable: false,
	enumerable: true,
});
