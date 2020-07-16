import { Meteor } from 'meteor/meteor';

import { Roles } from '../../../../app/models';
import { Logger } from '../../../../app/logger';
import { settings } from '../../../../app/settings';

const logger = new Logger('ldapEnterprise');

const mustBeAnArrayOfStrings = (array) => Array.isArray(array) && array.length && array.every((item) => typeof item === 'string');

const validateRoleMapping = (mappedRoles) => {
	const allRocketChatUserRoles = Roles.find({ scope: 'Users' }).fetch().map((role) => role._id);
	const mappedRocketChatRoles = Object.values(mappedRoles);
	const validRolesMapping = mappedRocketChatRoles.every((roles) => roles.every((role) => allRocketChatUserRoles.includes(role)));
	if (!validRolesMapping) {
		throw new Error('Please verify your mapping for LDAP X RocketChat Roles. There is some invalid Rocket Chat Role.');
	}
};

const validateLDAPRolesMappingStructure = (mappedRoles) => {
	const mappedRocketChatRoles = Object.values(mappedRoles);
	const validStructureMapping = mappedRocketChatRoles.every(mustBeAnArrayOfStrings);
	if (!validStructureMapping) {
		throw new Error('Please verify your mapping for LDAP X RocketChat Roles. The structure is invalid, the structure should be an object like: {key: LdapRole, value: [An array of rocket.chat roles]}');
	}
};

export const getLdapRolesByUsername = (username, ldap) => {
	const searchOptions = {
		filter: settings.get('LDAP_Query_To_Get_User_Groups').replace(/#{username}/g, username),
		scope: ldap.options.User_Search_Scope || 'sub',
		sizeLimit: ldap.options.Search_Size_Limit,
	};
	const getLdapRoles = (ldapUserGroups) => ldapUserGroups.filter((field) => field && field.ou).map((field) => field.ou);
	const ldapUserGroups = ldap.searchAllSync(ldap.options.BaseDN, searchOptions);
	return Array.isArray(ldapUserGroups) ? getLdapRoles(ldapUserGroups) : [];
};

export const getRocketChatRolesByLdapRoles = (mappedRoles, ldapUserRoles) => {
	const mappedLdapRoles = Object.keys(mappedRoles);
	if (!ldapUserRoles.length) {
		logger.error('The LDAP user has no role, so we set the default role value');
		return [settings.get('LDAP_Default_Role_To_User')];
	}
	const unmappedLdapRoles = ldapUserRoles.filter((ldapRole) => !mappedLdapRoles.includes(ldapRole));
	const getRocketChatMappedRoles = (acc, role) => acc.concat(mappedRoles[role]);
	const removeRepeatedRoles = (acc, role) => (acc.includes(role) ? acc : acc.concat(role));
	if (unmappedLdapRoles.length) {
		logger.error(`The following LDAP roles is/are not mapped in Rocket.Chat: "${ unmappedLdapRoles.join(', ') }". Because it, we set the default LDAP role.`);
		return [settings.get('LDAP_Default_Role_To_User')];
	}
	return ldapUserRoles
		.reduce(getRocketChatMappedRoles, [])
		.reduce(removeRepeatedRoles, []);
};

export const updateUserUsingMappedLdapRoles = (userId, roles) => {
	Meteor.users.update({ _id: userId }, { $set: { roles } });
};

export const validateLDAPRolesMappingChanges = () => {
	settings.get('LDAP_Roles_To_Rocket_Chat_Roles', (key, value) => {
		try {
			if (value) {
				const mappedRoles = JSON.parse(value);
				validateLDAPRolesMappingStructure(mappedRoles);
				validateRoleMapping(mappedRoles);
			}
		} catch (error) {
			logger.error(error);
		}
	});
};
