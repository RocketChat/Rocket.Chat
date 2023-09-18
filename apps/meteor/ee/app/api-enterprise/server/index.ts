import { onLicense } from '@rocket.chat/license';

await onLicense('canned-responses', async () => {
	await import('./canned-responses');
});
