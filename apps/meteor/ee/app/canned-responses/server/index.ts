import { onLicense } from '../../license/server';

onLicense('canned-responses', async () => {
	const { createSettings } = await import('./settings');

	require('./permissions');
	require('./hooks/onRemoveAgentDepartment');
	require('./hooks/onSaveAgentDepartment');
	require('./hooks/onMessageSentParsePlaceholder');
	require('./methods/saveCannedResponse');
	require('./methods/removeCannedResponse');

	createSettings();
});
