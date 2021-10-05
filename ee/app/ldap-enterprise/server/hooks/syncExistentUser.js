import { logger } from '../../../../../app/ldap/server/sync';
import { setUserActiveStatus } from '../../../../../app/lib/server/functions/setUserActiveStatus';
import { settings } from '../../../../../app/settings';

export const syncExistentUser = ({ ldapUser, user }) => {
	const activate = !!ldapUser && !ldapUser.pwdAccountLockedTime;

	if (activate === user.active) {
		return;
	}

	const syncUserState = settings.get('LDAP_Sync_User_Active_State');
	if (syncUserState === 'none' || (syncUserState === 'disable' && activate)) {
		return;
	}

	setUserActiveStatus(user._id, activate);
	logger.info(`${ activate ? 'Activating' : 'Deactivating' } user ${ user.name } (${ user._id })`);
};
