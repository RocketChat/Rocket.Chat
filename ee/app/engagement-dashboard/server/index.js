import { onLicense } from '../../license/server';

onLicense('engagement-dashboard', async () => {
	await import('./listeners');
	await import('./api');
});
