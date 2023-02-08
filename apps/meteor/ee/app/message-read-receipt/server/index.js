import { onLicense } from '../../license/server';

onLicense('message-read-receipt', () => {
	require('./hooks');
});
