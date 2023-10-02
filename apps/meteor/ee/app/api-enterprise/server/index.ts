import { License } from '@rocket.chat/license';

await License.onLicense('canned-responses', async () => {
	await import('./canned-responses');
});
