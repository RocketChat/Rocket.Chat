import { License } from '@rocket.chat/license';

await License.onLicense('message-read-receipt', async () => {
	await import('./hooks');
});
