import { License } from '@rocket.chat/license';

import { createPermissions } from '../lib/audit/startup';

License.onLicense('auditing', () => {
	// Use sync require to avoid Meteor nested async import issues.
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('../lib/audit/methods');
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('../api/audit');

	void createPermissions();
});
