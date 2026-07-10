import { License } from '@rocket.chat/license';

await License.onLicense('canned-responses', async () => {
	const { createSettings } = await import('./settings');
	await import('./permissions');
	await import('../../../server/hooks/canned-responses/onRemoveAgentDepartment');
	await import('../../../server/hooks/canned-responses/onSaveAgentDepartment');
	await import('../../../server/hooks/canned-responses/cannedResponses');
	await import('../../../server/meteor-methods/saveCannedResponse');
	await import('../../../server/meteor-methods/removeCannedResponse');

	await createSettings();
});
