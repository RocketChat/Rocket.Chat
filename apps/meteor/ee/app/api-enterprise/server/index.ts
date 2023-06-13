import { onLicense } from '../../license/server';

await onLicense('canned-responses', async () => {
	await import('./canned-responses');
});
