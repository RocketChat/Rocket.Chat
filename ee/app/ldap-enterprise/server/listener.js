import { settings } from '../../../../app/settings';
import { getLdapRolesByUsername, getRocketChatRolesByLdapRoles, updateUserUsingMappedLdapRoles } from './ldapEnterprise';

export const onLdapLogin = ({ user, ldapUser, ldap }) => {
	const validateLdapRolesForEachLogin = settings.get('LDAP_Validate_Roles_For_Each_Login');
	const userExists = user._id;
	const userId = userExists ? user._id : user.userId;
	if (!userExists || validateLdapRolesForEachLogin) {
		const ldapUserRoles = getLdapRolesByUsername(ldapUser.uid, ldap);
		const roles = getRocketChatRolesByLdapRoles(JSON.parse(settings.get('LDAP_Roles_To_Rocket_Chat_Roles')), ldapUserRoles);
		updateUserUsingMappedLdapRoles(userId, roles);
	}
};
