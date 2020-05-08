import { Meteor } from 'meteor/meteor';

import './hooks/syncExistentUser';
import './hooks/beforeSearchAll';

import { callbacks } from '../../../../app/callbacks/server';
import { settings } from '../../../../app/settings';
import { onLicense } from '../../license/server';

onLicense('ldap-enterprise', () => {
	const { createSettings } = require('./settings');
	const { validateLDAPRolesMappingChanges } = require('./ldapEnterprise');
	const { onLdapLogin } = require('./listener');

	Meteor.startup(function() {
		createSettings();
		validateLDAPRolesMappingChanges();

		let LDAP_Enable_LDAP_Roles_To_RC_Roles;
		settings.get('LDAP_Enable_LDAP_Roles_To_RC_Roles', (key, value) => {
			if (LDAP_Enable_LDAP_Roles_To_RC_Roles === value) {
				return;
			}

			LDAP_Enable_LDAP_Roles_To_RC_Roles = value;
			if (!value) {
				return callbacks.remove('afterLDAPLogin', 'checkRoleMapping');
			}

			callbacks.add('afterLDAPLogin', onLdapLogin, callbacks.priority.MEDIUM, 'checkRoleMapping');
		});
	});
});
