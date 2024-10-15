import { License } from '@rocket.chat/license';

await License.onLicense('chat.rocket.contact-id-verification', async () => {
	await import('./hooks');
});
