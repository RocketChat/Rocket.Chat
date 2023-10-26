import { License } from '@rocket.chat/license';

await License.onLicense('canned-responses', async () => {
	const { createSettings } = await import('./settings');
	await import('./permissions');
	await import('./hooks/onRemoveAgentDepartment');
	await import('./hooks/onSaveAgentDepartment');
	await import('./hooks/onMessageSentParsePlaceholder');
	await import('./methods/saveCannedResponse');
	await import('./methods/removeCannedResponse');

	await createSettings();
});
