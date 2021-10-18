import { onLicense } from '../../license/server';

onLicense('canned-responses', async () => {
	await import('./canned-responses');
});
