import { settings } from '../../../../app/settings';
import {
	getLdapRolesByUsername,
	getRocketChatRolesByLdapRoles,
	updateUserUsingMappedLdapRoles,
	getLdapTeamsByUsername,
	getRocketChatTeamsByLdapTeams,
	updateUserUsingMappedLdapTeams,
} from './ldapEnterprise';

export const onLdapLogin = ({ user, ldapUser, ldap }) => {
	const userExists = user._id;
	const userId = userExists ? user._id : user.userId;

	const mapRoles = settings.get('LDAP_Enable_LDAP_Roles_To_RC_Roles') && (!userExists || settings.get('LDAP_Validate_Roles_For_Each_Login'));
	const mapTeams = settings.get('LDAP_Enable_LDAP_Groups_To_RC_Teams') && (!userExists || settings.get('LDAP_Validate_Teams_For_Each_Login'));

	if (mapRoles) {
		const ldapUserRoles = getLdapRolesByUsername(ldapUser.uid, ldap);
		const roles = getRocketChatRolesByLdapRoles(JSON.parse(settings.get('LDAP_Roles_To_Rocket_Chat_Roles')), ldapUserRoles);
		updateUserUsingMappedLdapRoles(userId, roles);
	}

	if (mapTeams) {
		const ldapUserTeams = getLdapTeamsByUsername(ldapUser.uid, ldap);
		const map = JSON.parse(settings.get('LDAP_Groups_To_Rocket_Chat_Teams'));
		const teams = getRocketChatTeamsByLdapTeams(map, ldapUserTeams);
		updateUserUsingMappedLdapTeams(userId, teams, map);
	}
};
