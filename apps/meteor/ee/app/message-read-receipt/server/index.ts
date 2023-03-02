import { onLicense } from '../../license/server';

onLicense('message-read-receipt', async () => {
	await import('./hooks');
});
