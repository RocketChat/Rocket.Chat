import { License } from '@rocket.chat/license';

import { callbacks } from '../../../../lib/callbacks';
import { validateUserRoles } from './validateUserRoles';

License.on('installed', async () => {
	callbacks.add(
		'beforeSaveUser',
		async ({ user, oldUser }) => {
			await validateUserRoles(user, oldUser);
		},
		callbacks.priority.HIGH,
		'validateUserRoles',
	);
	callbacks.add('afterSaveUser', () => License.shouldPreventAction('activeUsers'), callbacks.priority.HIGH, 'validateUserRoles');
});

License.on('invalidate', async () => {
	callbacks.remove('beforeSaveUser', 'validateUserRoles');
	callbacks.remove('afterSaveUser', 'validateUserRoles');
});
