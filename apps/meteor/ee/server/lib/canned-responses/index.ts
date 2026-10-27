import { License } from '@rocket.chat/license';

await License.onLicense('canned-responses', async () => {
	const { createSettings } = await import('./settings');
	await import('./permissions');
	await import('../../hooks/canned-responses/onRemoveAgentDepartment');
	await import('../../hooks/canned-responses/onSaveAgentDepartment');
	await import('../../hooks/canned-responses/cannedResponses');
	await import('../../meteor-methods/saveCannedResponse');
	await import('../../meteor-methods/removeCannedResponse');

	await createSettings();
});
