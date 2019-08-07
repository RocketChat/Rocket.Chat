import mock from 'mock-require';

mock('meteor/meteor', {
	Meteor: {
		absoluteUrl() {
			return 'http://localhost:3000/';
		},
	},
});
