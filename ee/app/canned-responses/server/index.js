import { Meteor } from 'meteor/meteor';

import { onLicense } from '../../license/server';

onLicense('canned-responses', () => {
	const { createSettings } = require('./settings');
	require('./permissions');
	require('./methods/saveCannedResponse');
	require('./methods/removeCannedResponse');

	Meteor.startup(function() {
		createSettings();
	});
});
