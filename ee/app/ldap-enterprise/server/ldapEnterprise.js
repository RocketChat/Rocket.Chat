import { Meteor } from 'meteor/meteor';

import { Roles } from '../../../../app/models';
import { Logger } from '../../../../app/logger';
import { settings } from '../../../../app/settings';
import { Team } from '../../../../server/sdk';

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

const validateLDAPTeamsMappingStructure = (mappedTeams) => {
	const mappedRocketChatTeams = Object.values(mappedTeams);
	const validStructureMapping = mappedRocketChatTeams.every(mustBeAnArrayOfStrings);
	if (!validStructureMapping) {
		throw new Error('Please verify your mapping for LDAP X RocketChat Teams. The structure is invalid, the structure should be an object like: {key: LdapTeam, value: [An array of rocket.chat teams]}');
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

export const getLdapTeamsByUsername = (username, ldap) => {
	const searchOptions = {
		filter: settings.get('LDAP_Query_To_Get_User_Teams').replace(/#{username}/g, username),
		scope: ldap.options.User_Search_Scope || 'sub',
		sizeLimit: ldap.options.Search_Size_Limit,
	};
	const ldapUserGroups = ldap.searchAllSync(ldap.options.BaseDN, searchOptions);

	if (!Array.isArray(ldapUserGroups)) {
		return [];
	}

	return ldapUserGroups.filter((field) => field && field.ou).map((field) => field.ou).flat();
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

export const getRocketChatTeamsByLdapTeams = (mappedTeams, ldapUserTeams) => {
	const mappedLdapTeams = Object.keys(mappedTeams);
	const filteredTeams = ldapUserTeams.filter((ldapTeam) => mappedLdapTeams.includes(ldapTeam));

	if (filteredTeams.length < ldapUserTeams.length) {
		const unmappedLdapTeams = ldapUserTeams.filter((ldapRole) => !mappedLdapTeams.includes(ldapRole));
		logger.error(`The following LDAP teams are not mapped in Rocket.Chat: "${ unmappedLdapTeams.join(', ') }".`);
	}

	if (!filteredTeams.length) {
		return [];
	}

	return [...new Set(filteredTeams.map((ldapTeam) => mappedTeams[ldapTeam]).flat())];
};

export const updateUserUsingMappedLdapRoles = (userId, roles) => {
	Meteor.users.update({ _id: userId }, { $set: { roles } });
};

async function updateUserUsingMappedLdapTeamsAsync(userId, teamNames, map) {
	const allTeamNames = [...new Set(Object.values(map).flat())];
	const allTeams = await Team.listByNames(allTeamNames, { projection: { _id: 1, name: 1 } });

	const inTeamIds = allTeams.filter(({ name }) => teamNames.includes(name)).map(({ _id }) => _id);
	const notInTeamIds = allTeams.filter(({ name }) => !teamNames.includes(name)).map(({ _id }) => _id);

	const currentTeams = await Team.listTeamsBySubscriberUserId(userId, { projection: { teamId: 1 } });
	const currentTeamIds = await currentTeams.map(({ teamId }) => teamId);
	const teamsToRemove = currentTeamIds.filter((teamId) => notInTeamIds.includes(teamId));
	const teamsToAdd = inTeamIds.filter((teamId) => !currentTeamIds.includes(teamId));

	await Team.insertMemberOnTeams(userId, teamsToAdd);
	await Team.removeMemberFromTeams(userId, teamsToRemove);
}

export const updateUserUsingMappedLdapTeams = (userId, teamNames, map) => Promise.await(updateUserUsingMappedLdapTeamsAsync(userId, teamNames, map));

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

export const validateLDAPTeamsMappingChanges = () => {
	settings.get('LDAP_Groups_To_Rocket_Chat_Teams', (key, value) => {
		try {
			if (value) {
				const mappedTeams = JSON.parse(value);
				validateLDAPTeamsMappingStructure(mappedTeams);
			}
		} catch (error) {
			logger.error(error);
		}
	});
};
