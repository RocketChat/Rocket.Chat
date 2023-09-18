import { onLicense } from '@rocket.chat/license';

import { createPermissions } from '../lib/audit/startup';

await onLicense('auditing', async () => {
	await import('../lib/audit/methods');

	await createPermissions();
});
