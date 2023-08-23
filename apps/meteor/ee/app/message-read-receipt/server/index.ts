import { onLicense } from '../../license/server';

await onLicense('message-read-receipt', async () => {
	await import('./hooks');
});
