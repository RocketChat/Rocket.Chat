import { onLicense } from '@rocket.chat/license';

await onLicense('message-read-receipt', async () => {
	await import('./hooks');
});
