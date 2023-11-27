import { MeteorError } from '@rocket.chat/core-services';
import { License } from '@rocket.chat/license';

import { callbacks } from '../../../../lib/callbacks';
import { i18n } from '../../../../server/lib/i18n';
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

	callbacks.add(
		'beforeActivateUser',
		async () => {
			if (await License.shouldPreventAction('activeUsers')) {
				throw new MeteorError('error-license-user-limit-reached', i18n.t('error-license-user-limit-reached'));
			}
			return undefined;
		},
		callbacks.priority.HIGH,
		'validateUserStatus',
	);
});

License.onInvalidate(() => {
	callbacks.remove('beforeSaveUser', 'validateUserRoles');
	callbacks.remove('afterSaveUser', 'validateUserRoles');
	callbacks.remove('afterDeleteUser', 'validateUserRoles');

	callbacks.remove('afterDeactivateUser', 'validateUserStatus');
	callbacks.remove('beforeActivateUser', 'validateUserStatus');
});
