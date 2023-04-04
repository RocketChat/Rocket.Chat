import { onLicense } from '../../license/server';

onLicense('canned-responses', () => {
	const { createSettings } = require('./settings');
	require('./permissions');
	require('./hooks/onRemoveAgentDepartment');
	require('./hooks/onSaveAgentDepartment');
	require('./hooks/onMessageSentParsePlaceholder');
	require('./methods/saveCannedResponse');
	require('./methods/removeCannedResponse');

	createSettings();
});
