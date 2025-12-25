import { License } from '@rocket.chat/license';

License.onLicense('canned-responses', () => {
	// Use sync require to avoid Meteor nested async import issues.
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const settings = require('./settings');
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('./permissions');
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('./hooks/onRemoveAgentDepartment');
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('./hooks/onSaveAgentDepartment');
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('./hooks/cannedResponses');
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('./methods/saveCannedResponse');
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('./methods/removeCannedResponse');

	const createSettings = settings?.createSettings ?? settings?.default?.createSettings;
	if (typeof createSettings === 'function') {
		void createSettings();
	}
});
