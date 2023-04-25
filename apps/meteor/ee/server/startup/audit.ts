import { onLicense } from '../../app/license/server';
import { createPermissions } from '../lib/audit/startup';

await onLicense('auditing', async () => {
	await import('../lib/audit/methods');

	await createPermissions();
});
