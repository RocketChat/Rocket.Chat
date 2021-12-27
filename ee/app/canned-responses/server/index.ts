import { Meteor } from 'meteor/meteor';

import { onLicense } from '../../license/server';

onLicense('canned-responses', () => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const { createSettings } = require('./settings');
	require('./permissions');
	require('./hooks/onRemoveAgentDepartment');
	require('./hooks/onSaveAgentDepartment');
	require('./hooks/onMessageSentParsePlaceholder');
	require('./methods/saveCannedResponse');
	require('./methods/removeCannedResponse');

	Meteor.startup(function() {
		createSettings();
	});
});
