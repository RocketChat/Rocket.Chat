import { License } from '@rocket.chat/license';

await License.onLicense('canned-responses', async () => {
	await import('./canned-responses');
});

await License.onLicense('voip-enterprise', async () => {
	await import('./voip-freeswitch');
});
