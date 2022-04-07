import mock from 'mock-require';
import _ from 'underscore';
import s from 'underscore.string';

_.mixin(s.exports());

mock('meteor/meteor', {
	Meteor: {
		absoluteUrl() {
			return 'http://localhost:3000/';
		},
	},
});

mock('meteor/blaze', {
	Blaze: {},
});

mock('../../../../app/settings', {
	settings: {
		get(setting) {
			switch (setting) {
				case 'DeepLink_Url':
					return 'https://go.rocket.chat';
				case 'Markdown_SupportSchemesForLink':
					return 'http,https';
				case 'Markdown_Parser':
					return 'original';
				case 'Markdown_Headers':
					// case 'Markdown_Marked_GFM':
					// case 'Markdown_Marked_Tables':
					// case 'Markdown_Marked_Breaks':
					// case 'Markdown_Marked_Pedantic':
					// case 'Markdown_Marked_SmartLists':
					// case 'Markdown_Marked_Smartypants':
					return true;
				default:
					throw new Error(`Missing setting mock ${setting}`);
			}
		},
	},
});

mock('../../callbacks', {
	callbacks: {
		add() {},
		priority: {
			HIGH: 1,
		},
	},
});

mock('meteor/random', {
	Random: {
		id() {
			return Math.random().toString().replace('0.', 'A');
		},
	},
});

global.s = s;
