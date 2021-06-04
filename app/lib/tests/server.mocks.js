import mock from 'mock-require';

mock('meteor/meteor', {
	Meteor: {
		absoluteUrl() {
			return 'http://localhost:3000/';
		},
	},
});

mock('meteor/random', {
	Random: {
		id() {
			return Math.random().toString(36).substring(7);
		},
	},
});
