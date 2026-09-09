import { License } from '@rocket.chat/license';

import { createPermissions } from '../lib/audit/startup';

await License.onLicense('auditing', async () => {
	await import('../api/audit');

	await createPermissions();
});
