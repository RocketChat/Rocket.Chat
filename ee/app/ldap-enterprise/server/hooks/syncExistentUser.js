import { callbacks } from '../../../../../app/callbacks';
import { logger } from '../../../../../app/ldap/server/sync';
import { setUserActiveStatus } from '../../../../../app/lib/server/functions/setUserActiveStatus';

callbacks.add('ldap.afterSyncExistentUser', ({ ldapUser, user }) => {
	const activate = !!ldapUser && !ldapUser.pwdAccountLockedTime;

	if (activate !== user.active) {
		setUserActiveStatus(user._id, activate);
		logger.info(`${ activate ? 'Activating' : 'Deactivating' } user ${ user.name } (${ user._id })`);
	}
}, callbacks.priority.MEDIUM, 'ldap-disable-enable-users');
