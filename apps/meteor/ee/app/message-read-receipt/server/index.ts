import { License } from '@rocket.chat/license';

License.onLicense('message-read-receipt', () => {
	// Use sync require to avoid Meteor nested async import issues.
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	require('./hooks');
});
