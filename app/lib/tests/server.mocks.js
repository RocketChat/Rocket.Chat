import mock from 'mock-require';

mock('meteor/meteor', {
	Meteor: {
		absoluteUrl() {
			return 'http://localhost:3000/';
		},
	},
});

mock('meteor/rocketchat:tap-i18n', {
	TAPi18n: {
		getLanguages() {
			return {};
		},
	},
});
