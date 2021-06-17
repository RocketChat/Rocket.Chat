import { Meteor } from 'meteor/meteor';


import { syncExistentUser } from './hooks/syncExistentUser';
import { beforeSearchAll } from './hooks/beforeSearchAll';
import { callbacks } from '../../../../server/utils/hooks';
import { settings } from '../../../../app/settings';
import { onLicense } from '../../license/server';

onLicense('ldap-enterprise', () => {
	const { createSettings } = require('./settings');
	const { validateLDAPRolesMappingChanges, validateLDAPTeamsMappingChanges } = require('./ldapEnterprise');
	const { onLdapLogin } = require('./listener');

	Meteor.startup(function() {
		createSettings();
		validateLDAPRolesMappingChanges();
		validateLDAPTeamsMappingChanges();

		let LDAP_Enable_LDAP_Roles_To_RC_Roles;
		let LDAP_Enable_LDAP_Groups_To_RC_Teams;
		let callbackEnabled = false;
		let LDAP_Sync_User_Active_State;

		const updateCallbackState = () => {
			if (callbackEnabled) {
				if (!LDAP_Enable_LDAP_Roles_To_RC_Roles && !LDAP_Enable_LDAP_Groups_To_RC_Teams) {
					callbacks.remove('afterLDAPLogin', 'checkRoleMapping');
					callbackEnabled = false;
				}

				return;
			}

			if (LDAP_Enable_LDAP_Roles_To_RC_Roles || LDAP_Enable_LDAP_Groups_To_RC_Teams) {
				callbackEnabled = true;
				callbacks.add('afterLDAPLogin', onLdapLogin, callbacks.priority.MEDIUM, 'checkRoleMapping');
			}
		};

		settings.get('LDAP_Enable_LDAP_Roles_To_RC_Roles', (key, value) => {
			LDAP_Enable_LDAP_Roles_To_RC_Roles = value;
			updateCallbackState();
		});

		settings.get('LDAP_Enable_LDAP_Groups_To_RC_Teams', (key, value) => {
			LDAP_Enable_LDAP_Groups_To_RC_Teams = value;
			updateCallbackState();
		});

		settings.get('LDAP_Sync_User_Active_State', (key, value) => {
			if (LDAP_Sync_User_Active_State === value) {
				return;
			}

			if (value === 'none') {
				// If it changed to 'none', disable
				callbacks.remove('ldap.afterSyncExistentUser', 'ldap-sync-user-active-state');
			} else if (LDAP_Sync_User_Active_State === 'none' || !LDAP_Sync_User_Active_State) {
				// If it changed from 'none' to something else, enable
				callbacks.add('ldap.afterSyncExistentUser', syncExistentUser, callbacks.priority.MEDIUM, 'ldap-sync-user-active-state');
			}

			LDAP_Sync_User_Active_State = value;
		});

		callbacks.add('ldap.beforeSearchAll', beforeSearchAll, callbacks.priority.MEDIUM, 'ldap-return-attribute-AccountLockedTime');
	});
});
