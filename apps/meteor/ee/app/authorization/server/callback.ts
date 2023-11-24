import { License } from '@rocket.chat/license';

import { callbacks } from '../../../../lib/callbacks';
import { validateUserRoles } from './validateUserRoles';

License.onInstall(() => {
	callbacks.add(
		'beforeSaveUser',
		async ({ user, oldUser }) => validateUserRoles(user, oldUser),
		callbacks.priority.HIGH,
		'validateUserRoles',
	);
	callbacks.add('afterSaveUser', () => License.shouldPreventAction('activeUsers'), callbacks.priority.HIGH, 'validateUserRoles');
	callbacks.add('afterDeleteUser', () => License.shouldPreventAction('activeUsers'), callbacks.priority.HIGH, 'validateUserRoles');

	callbacks.add('afterDeactivateUser', () => License.shouldPreventAction('activeUsers'), callbacks.priority.HIGH, 'validateUserStatus');

	callbacks.add('beforeActivateUser', () => License.shouldPreventAction('activeUsers'), callbacks.priority.HIGH, 'validateUserStatus');
});

License.onInvalidate(() => {
	callbacks.remove('beforeSaveUser', 'validateUserRoles');
	callbacks.remove('afterSaveUser', 'validateUserRoles');
	callbacks.remove('afterDeleteUser', 'validateUserRoles');

	callbacks.remove('afterDeactivateUser', 'validateUserStatus');
	callbacks.remove('beforeActivateUser', 'validateUserStatus');
});
