import proxyquire from 'proxyquire';
import _ from 'underscore';
import s from 'underscore.string';

_.mixin(s.exports());

const mocks = {
	'meteor/meteor': {
		'Meteor': {
			absoluteUrl() {
				return 'http://localhost:3000/';
			},
		},
		'@global': true,
	},
	'meteor/random': {
		'Random': {
			id() {
				return Math.random().toString().replace('0.', 'A');
			},
		},
		'@global': true,
	},
};

export const { Markdown } = proxyquire.noCallThru().load('../../../../app/markdown/lib/markdown', mocks);
export const { original } = proxyquire.noCallThru().load('../../../../app/markdown/lib/parser/original/original', mocks);
export const { filtered } = proxyquire.noCallThru().load('../../../../app/markdown/lib/parser/filtered/filtered', mocks);

global.s = s;
