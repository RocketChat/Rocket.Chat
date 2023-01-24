import { onLicense } from '../../license/server';

onLicense('message-read-receipt', () => {
	const { createSettings } = require('./settings');
	require('./hooks');

	createSettings();
});
