import { Meteor } from 'meteor/meteor';

import './hooks/syncExistentUser';
import './hooks/beforeSearchAll';

import { callbacks } from '../../../../app/callbacks/server';
import { onLicense } from '../../license/server';

onLicense('ldap-enterprise', () => {
	const { createSettings } = require('./settings');
	const { validateLDAPRolesMappingChanges } = require('./ldapEnterprise');
	const { onLdapLogin } = require('./listener');

	Meteor.startup(function() {
		createSettings();
		validateLDAPRolesMappingChanges();
		callbacks.add('afterLDAPLogin', onLdapLogin);
	});
});
