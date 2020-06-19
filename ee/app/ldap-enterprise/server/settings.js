import { settings } from '../../../../app/settings';
import { Roles } from '../../../../app/models';

export const createSettings = () => {
	settings.addGroup('LDAP', function() {
		this.section('Role_Mapping', function() {
			this.add('LDAP_Enable_LDAP_Roles_To_RC_Roles', false, {
				type: 'boolean',
				enableQuery: { _id: 'LDAP_Enable', value: true },
			});
			this.add('LDAP_Roles_To_Rocket_Chat_Roles', '{}', {
				type: 'code',
				enableQuery: { _id: 'LDAP_Enable_LDAP_Roles_To_RC_Roles', value: true },
			});
			this.add('LDAP_Validate_Roles_For_Each_Login', false, {
				type: 'boolean',
				enableQuery: { _id: 'LDAP_Enable_LDAP_Roles_To_RC_Roles', value: true },
			});
			this.add('LDAP_Default_Role_To_User', 'user', {
				type: 'select',
				values: Roles.find({ scope: 'Users' }).fetch().map((role) => ({ key: role._id, i18nLabel: role._id })),
				enableQuery: { _id: 'LDAP_Enable_LDAP_Roles_To_RC_Roles', value: true },
			});
			this.add('LDAP_Query_To_Get_User_Groups', '(&(ou=*)(uniqueMember=uid=#{username},dc=example,dc=com))', {
				type: 'string',
				enableQuery: { _id: 'LDAP_Enable_LDAP_Roles_To_RC_Roles', value: true },
			});
		});
	});
};
