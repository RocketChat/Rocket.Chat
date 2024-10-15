import { License } from '@rocket.chat/license';

await License.onLicense('contact-id-verification.verifyContactChannel', async () => {
	await import('./hooks');
});
