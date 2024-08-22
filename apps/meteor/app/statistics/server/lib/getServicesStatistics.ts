import { Users } from '@rocket.chat/models';
import { MongoInternals } from 'meteor/mongo';

import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';
import { settings } from '../../../settings/server';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

async function getCustomOAuthServices(): Promise<
	Record<
		string,
		{
			enabled: boolean;
			mergeRoles: boolean;
			users: number;
		}
	>
> {
	const readPreference = readSecondaryPreferred(db);

	const customOauth = settings.getByRegexp(/Accounts_OAuth_Custom-[^-]+$/im);
	return Object.fromEntries(
		await Promise.all(
			Object.entries(customOauth).map(async ([key, value]) => {
				const name = key.replace('Accounts_OAuth_Custom-', '');
				return [
					name,
					{
						enabled: Boolean(value),
						mergeRoles: settings.get<boolean>(`Accounts_OAuth_Custom-${name}-merge_roles`),
						users: await Users.countActiveUsersByService(name, { readPreference }),
						mapChannels: settings.get<boolean>(`Accounts_OAuth_Custom-${name}-map_channels`),
						rolesToSync: !!settings.get<string>(`Accounts_OAuth_Custom-${name}-roles_to_sync`),
					},
				];
			}),
		),
	);
}

export async function getServicesStatistics(): Promise<Record<string, unknown>> {
	const readPreference = readSecondaryPreferred(db);

	return {
		ldap: {
			users: await Users.countActiveUsersByService('ldap', { readPreference }),
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
			users: await Users.countActiveUsersByService('saml', { readPreference }),
			signatureValidationType: settings.get('SAML_Custom_Default_signature_validation_type'),
			generateUsername: settings.get('SAML_Custom_Default_generate_username'),
			updateSubscriptionsOnLogin: settings.get('SAML_Custom_Default_channels_update'),
			syncRoles: settings.get('SAML_Custom_Default_role_attribute_sync'),
			userDataCustomFieldMap: !(
				settings.getSetting('SAML_Custom_Default_user_data_custom_fieldmap')?.packageValue ===
				settings.getSetting('SAML_Custom_Default_user_data_custom_fieldmap')?.value
			),
		},
		cas: {
			enabled: settings.get('CAS_enabled'),
			users: await Users.countActiveUsersByService('cas', { readPreference }),
			allowUserCreation: settings.get('CAS_Creation_User_Enabled'),
			alwaysSyncUserData: settings.get('CAS_Sync_User_Data_Enabled'),
		},
		oauth: {
			apple: {
				enabled: settings.get('Accounts_OAuth_Apple'),
				users: await Users.countActiveUsersByService('apple', { readPreference }),
			},
			dolphin: {
				enabled: settings.get('Accounts_OAuth_Dolphin'),
				users: await Users.countActiveUsersByService('dolphin', { readPreference }),
			},
			drupal: {
				enabled: settings.get('Accounts_OAuth_Drupal'),
				users: await Users.countActiveUsersByService('drupal', { readPreference }),
			},
			facebook: {
				enabled: settings.get('Accounts_OAuth_Facebook'),
				users: await Users.countActiveUsersByService('facebook', { readPreference }),
			},
			github: {
				enabled: settings.get('Accounts_OAuth_Github'),
				users: await Users.countActiveUsersByService('github', { readPreference }),
			},
			githubEnterprise: {
				enabled: settings.get('Accounts_OAuth_GitHub_Enterprise'),
				users: await Users.countActiveUsersByService('github_enterprise', { readPreference }),
			},
			gitlab: {
				enabled: settings.get('Accounts_OAuth_Gitlab'),
				users: await Users.countActiveUsersByService('gitlab', { readPreference }),
			},
			google: {
				enabled: settings.get('Accounts_OAuth_Google'),
				users: await Users.countActiveUsersByService('google', { readPreference }),
			},
			linkedin: {
				enabled: settings.get('Accounts_OAuth_Linkedin'),
				users: await Users.countActiveUsersByService('linkedin', { readPreference }),
			},
			meteor: {
				enabled: settings.get('Accounts_OAuth_Meteor'),
				users: await Users.countActiveUsersByService('meteor', { readPreference }),
			},
			nextcloud: {
				enabled: settings.get('Accounts_OAuth_Nextcloud'),
				users: await Users.countActiveUsersByService('nextcloud', { readPreference }),
			},
			tokenpass: {
				enabled: settings.get('Accounts_OAuth_Tokenpass'),
				users: await Users.countActiveUsersByService('tokenpass', { readPreference }),
			},
			twitter: {
				enabled: settings.get('Accounts_OAuth_Twitter'),
				users: await Users.countActiveUsersByService('twitter', { readPreference }),
			},
			wordpress: {
				enabled: settings.get('Accounts_OAuth_Wordpress'),
				users: await Users.countActiveUsersByService('wordpress', { readPreference }),
			},
			custom: await getCustomOAuthServices(),
		},
	};
}
