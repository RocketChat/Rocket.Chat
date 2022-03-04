import { settings } from '../../../settings/server';
import { Users } from '../../../models/server';

function getCustomOAuthServices(): Record<
	string,
	{
		enabled: boolean;
		mergeRoles: boolean;
		users: number;
		createdUsers: number;
	}
> {
	const customOauth = settings.getByRegexp(/Accounts_OAuth_Custom-[^-]+$/im);
	return Object.fromEntries(
		Object.entries(customOauth).map(([key, value]) => {
			const name = key.replace('Accounts_OAuth_Custom-', '');
			return [
				name,
				{
					enabled: Boolean(value),
					mergeRoles: settings.get<boolean>(`Accounts_OAuth_Custom-${name}-merge_roles`),
					users: Users.countActiveUsersByService(name),
					createdUsers: Users.countUsersByService(name),
				},
			];
		}),
	);
}

export function getServicesStatistics(): Record<string, unknown> {
	return {
		ldap: {
			users: Users.countActiveUsersByService('ldap'),
			createdUsers: Users.countUsersByService('ldap'),
			enabled: settings.get('LDAP_Enable'),
			loginFallback: settings.get('LDAP_Login_Fallback'),
			encryption: settings.get('LDAP_Encryption'),
			mergeUsers: settings.get('LDAP_Merge_Existing_Users'),
			syncRoles: settings.get('LDAP_Sync_User_Data_Roles'),
			syncRolesAutoRemove: settings.get('LDAP_Sync_User_Data_Roles_AutoRemove'),
			syncData: settings.get('LDAP_Sync_Custom_Fields'),
			syncChannels: settings.get('LDAP_Sync_User_Data_Channels'),
			syncAvatar: settings.get('LDAP_Sync_User_Avatar'),
			groupFilter: settings.get('LDAP_Group_Filter_Enable'),
			backgroundSync: {
				enabled: settings.get('LDAP_Background_Sync'),
				interval: settings.get('LDAP_Background_Sync_Interval'),
				newUsers: settings.get('LDAP_Background_Sync_Import_New_Users'),
				existingUsers: settings.get('LDAP_Background_Sync_Keep_Existant_Users_Updated'),
			},
			ee: {
				syncActiveState: settings.get('LDAP_Sync_User_Active_State'),
				syncTeams: settings.get('LDAP_Enable_LDAP_Groups_To_RC_Teams'),
				syncRoles: settings.get('LDAP_Sync_User_Data_Roles'),
			},
		},
		saml: {
			enabled: settings.get('SAML_Custom_Default'),
			users: Users.countActiveUsersByService('saml'),
			createdUsers: Users.countUsersByService('saml'),
			signatureValidationType: settings.get('SAML_Custom_Default_signature_validation_type'),
			generateUsername: settings.get('SAML_Custom_Default_generate_username'),
			updateSubscriptionsOnLogin: settings.get('SAML_Custom_Default_channels_update'),
			syncRoles: settings.get('SAML_Custom_Default_role_attribute_sync'),
		},
		cas: {
			enabled: settings.get('CAS_enabled'),
			users: Users.countActiveUsersByService('cas'),
			createdUsers: Users.countUsersByService('cas'),
			allowUserCreation: settings.get('CAS_Creation_User_Enabled'),
			alwaysSyncUserData: settings.get('CAS_Sync_User_Data_Enabled'),
		},
		oauth: {
			apple: {
				enabled: settings.get('Accounts_OAuth_Apple'),
				users: Users.countActiveUsersByService('apple'),
				createdUsers: Users.countUsersByService('apple'),
			},
			dolphin: {
				enabled: settings.get('Accounts_OAuth_Dolphin'),
				users: Users.countActiveUsersByService('dolphin'),
				createdUsers: Users.countUsersByService('dolphin'),
			},
			drupal: {
				enabled: settings.get('Accounts_OAuth_Drupal'),
				users: Users.countActiveUsersByService('drupal'),
				createdUsers: Users.countUsersByService('drupal'),
			},
			facebook: {
				enabled: settings.get('Accounts_OAuth_Facebook'),
				users: Users.countActiveUsersByService('facebook'),
				createdUsers: Users.countUsersByService('facebook'),
			},
			github: {
				enabled: settings.get('Accounts_OAuth_Github'),
				users: Users.countActiveUsersByService('github'),
				createdUsers: Users.countUsersByService('github'),
			},
			githubEnterprise: {
				enabled: settings.get('Accounts_OAuth_GitHub_Enterprise'),
				users: Users.countActiveUsersByService('github_enterprise'),
				createdUsers: Users.countUsersByService('github_enterprise'),
			},
			gitlab: {
				enabled: settings.get('Accounts_OAuth_Gitlab'),
				users: Users.countActiveUsersByService('gitlab'),
				createdUsers: Users.countUsersByService('gitlab'),
			},
			google: {
				enabled: settings.get('Accounts_OAuth_Google'),
				users: Users.countActiveUsersByService('google'),
				createdUsers: Users.countUsersByService('google'),
			},
			linkedin: {
				enabled: settings.get('Accounts_OAuth_Linkedin'),
				users: Users.countActiveUsersByService('linkedin'),
				createdUsers: Users.countUsersByService('linkedin'),
			},
			meteor: {
				enabled: settings.get('Accounts_OAuth_Meteor'),
				users: Users.countActiveUsersByService('meteor'),
				createdUsers: Users.countUsersByService('meteor'),
			},
			nextcloud: {
				enabled: settings.get('Accounts_OAuth_Nextcloud'),
				users: Users.countActiveUsersByService('nextcloud'),
				createdUsers: Users.countUsersByService('nextcloud'),
			},
			tokenpass: {
				enabled: settings.get('Accounts_OAuth_Tokenpass'),
				users: Users.countActiveUsersByService('tokenpass'),
				createdUsers: Users.countUsersByService('tokenpass'),
			},
			twitter: {
				enabled: settings.get('Accounts_OAuth_Twitter'),
				users: Users.countActiveUsersByService('twitter'),
				createdUsers: Users.countUsersByService('twitter'),
			},
			wordpress: {
				enabled: settings.get('Accounts_OAuth_Wordpress'),
				users: Users.countActiveUsersByService('wordpress'),
				createdUsers: Users.countUsersByService('wordpress'),
			},
			custom: getCustomOAuthServices(),
		},
	};
}
