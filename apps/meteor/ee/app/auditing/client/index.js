import { hasLicense } from '../../license/client';

hasLicense('auditing')
	.then((enabled) => {
		if (!enabled) {
			return;
		}
		require('./templates');
		require('./index.css');
	})
	.catch((error) => {
		console.error('Error checking license.', error);
	});
