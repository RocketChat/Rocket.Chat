import { MongoInternals } from 'meteor/mongo';

import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';
import { settings } from '../../../settings/server';
import { Users } from '../../../models/server';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

function getCustomOAuthServices(): Record<
	string,
	{
		enabled: boolean;
		mergeRoles: boolean;
		users: number;
	}
> {
	const readPreference = readSecondaryPreferred(db);

	const customOauth = settings.getByRegexp(/Accounts_OAuth_Custom-[^-]+$/im);
	return Object.fromEntries(
		Object.entries(customOauth).map(([key, value]) => {
			const name = key.replace('Accounts_OAuth_Custom-', '');
			return [
				name,
				{
					enabled: Boolean(value),
					mergeRoles: settings.get<boolean>(`Accounts_OAuth_Custom-${name}-merge_roles`),
					users: Users.countActiveUsersByService(name, { readPreference }),
				},
			];
		}),
	);
}

export function getServicesStatistics(): Record<string, unknown> {
	const readPreference = readSecondaryPreferred(db);

	return {
		ldap: {
			users: Users.countActiveUsersByService('ldap', { readPreference }),
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
			users: Users.countActiveUsersByService('saml', { readPreference }),
			signatureValidationType: settings.get('SAML_Custom_Default_signature_validation_type'),
			generateUsername: settings.get('SAML_Custom_Default_generate_username'),
			updateSubscriptionsOnLogin: settings.get('SAML_Custom_Default_channels_update'),
			syncRoles: settings.get('SAML_Custom_Default_role_attribute_sync'),
		},
		cas: {
			enabled: settings.get('CAS_enabled'),
			users: Users.countActiveUsersByService('cas', { readPreference }),
			allowUserCreation: settings.get('CAS_Creation_User_Enabled'),
			alwaysSyncUserData: settings.get('CAS_Sync_User_Data_Enabled'),
		},
		oauth: {
			apple: {
				enabled: settings.get('Accounts_OAuth_Apple'),
				users: Users.countActiveUsersByService('apple', { readPreference }),
			},
			dolphin: {
				enabled: settings.get('Accounts_OAuth_Dolphin'),
				users: Users.countActiveUsersByService('dolphin', { readPreference }),
			},
			drupal: {
				enabled: settings.get('Accounts_OAuth_Drupal'),
				users: Users.countActiveUsersByService('drupal', { readPreference }),
			},
			facebook: {
				enabled: settings.get('Accounts_OAuth_Facebook'),
				users: Users.countActiveUsersByService('facebook', { readPreference }),
			},
			github: {
				enabled: settings.get('Accounts_OAuth_Github'),
				users: Users.countActiveUsersByService('github', { readPreference }),
			},
			githubEnterprise: {
				enabled: settings.get('Accounts_OAuth_GitHub_Enterprise'),
				users: Users.countActiveUsersByService('github_enterprise', { readPreference }),
			},
			gitlab: {
				enabled: settings.get('Accounts_OAuth_Gitlab'),
				users: Users.countActiveUsersByService('gitlab', { readPreference }),
			},
			google: {
				enabled: settings.get('Accounts_OAuth_Google'),
				users: Users.countActiveUsersByService('google', { readPreference }),
			},
			linkedin: {
				enabled: settings.get('Accounts_OAuth_Linkedin'),
				users: Users.countActiveUsersByService('linkedin', { readPreference }),
			},
			meteor: {
				enabled: settings.get('Accounts_OAuth_Meteor'),
				users: Users.countActiveUsersByService('meteor', { readPreference }),
			},
			nextcloud: {
				enabled: settings.get('Accounts_OAuth_Nextcloud'),
				users: Users.countActiveUsersByService('nextcloud', { readPreference }),
			},
			tokenpass: {
				enabled: settings.get('Accounts_OAuth_Tokenpass'),
				users: Users.countActiveUsersByService('tokenpass', { readPreference }),
			},
			twitter: {
				enabled: settings.get('Accounts_OAuth_Twitter'),
				users: Users.countActiveUsersByService('twitter', { readPreference }),
			},
			wordpress: {
				enabled: settings.get('Accounts_OAuth_Wordpress'),
				users: Users.countActiveUsersByService('wordpress', { readPreference }),
			},
			custom: getCustomOAuthServices(),
		},
	};
}
