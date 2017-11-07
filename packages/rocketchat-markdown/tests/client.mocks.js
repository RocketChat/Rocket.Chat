import mock from 'mock-require';
import _ from 'underscore';
import s from 'underscore.string';
_.mixin(s.exports());

mock('meteor/meteor', {
	Meteor: {
		absoluteUrl() {
			return 'http://localhost:3000/';
		}
	}
});

mock('meteor/rocketchat:lib', {
	RocketChat: {
		settings: {
			get(setting) {
				switch (setting) {
					case 'Markdown_SupportSchemesForLink':
						return 'http,https';
					case 'Markdown_Headers':
					// case 'Markdown_Marked_GFM':
					// case 'Markdown_Marked_Tables':
					// case 'Markdown_Marked_Breaks':
					// case 'Markdown_Marked_Pedantic':
					// case 'Markdown_Marked_SmartLists':
					// case 'Markdown_Marked_Smartypants':
						return true;
					default:
						throw new Error(`Missing setting mock ${ setting }`);
				}
			}
		}
	}
});

mock('meteor/random', {
	Random: {
		id() {
			return Math.random();
		}
	}
});

global.s = s;
