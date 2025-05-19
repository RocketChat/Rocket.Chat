import type { ISetting } from '@rocket.chat/core-typings';
import { MongoClient } from 'mongodb';

import * as constants from './config/constants';
import { provideContainerFor } from './containers/provideContainer';
import { Users } from './fixtures/userStates';
import { Registration } from './page-objects';
import { test, expect } from './utils/test';

const resetTestData = async ({ cleanupOnly = false }: { cleanupOnly?: boolean } = {}) => {
	const connection = await MongoClient.connect(constants.URL_MONGODB);

	const usernamesToDelete = [Users.ldapUser1, Users.ldapUser2, Users.ldapUser3].map(({ data: { username } }) => username);
	await connection
		.db()
		.collection('users')
		.deleteMany({
			username: {
				$in: usernamesToDelete,
			},
		});

	if (cleanupOnly) {
		return;
	}

	const settings = [
		{ _id: 'LDAP_Enable', value: true },
		{ _id: 'LDAP_Server_Type', value: '' },
		{ _id: 'LDAP_Host', value: 'localhost' },
		{ _id: 'LDAP_Port', value: 1389 },
		{ _id: 'LDAP_Reconnect', value: false },
		{ _id: 'LDAP_Login_Fallback', value: false },
		{ _id: 'LDAP_Authentication', value: true },
		{ _id: 'LDAP_Authentication_UserDN', value: 'cn=admin,dc=space,dc=air' },
		{ _id: 'LDAP_Authentication_Password', value: 'adminpassword' },
		{ _id: 'LDAP_Encryption', value: 'plain' },
		{ _id: 'LDAP_CA_Cert', value: '' },
		{ _id: 'LDAP_Find_User_After_Login', value: true },
		{ _id: 'LDAP_BaseDN', value: 'ou=users,dc=space,dc=air' },
		{ _id: 'LDAP_User_Search_Filter', value: '(objectclass=*)' },
		{ _id: 'LDAP_User_Search_Scope', value: 'sub' },
		{ _id: 'LDAP_User_Search_Field', value: 'uid' },
		{ _id: 'LDAP_Group_Filter_Enable', value: false },
		{ _id: 'LDAP_Unique_Identifier_Field', value: 'objectGUID,ibm-entryUUID,GUID,dominoUNID,nsuniqueId,uidNumber,uid' },
		{ _id: 'LDAP_Merge_Existing_Users', value: false },
		{ _id: 'LDAP_Update_Data_On_Login', value: true },
		{ _id: 'LDAP_Update_Data_On_OAuth_Login', value: false },
		{ _id: 'LDAP_Default_Domain', value: '' },
		{ _id: 'LDAP_Username_Field', value: 'uid' },
		{ _id: 'LDAP_Email_Field', value: 'mail' },
		{ _id: 'LDAP_Name_Field', value: 'cn' },
		{ _id: 'LDAP_Extension_Field', value: '' },
		{ _id: 'LDAP_FederationHomeServer_Field', value: '' },
		{ _id: 'LDAP_DataSync_UseVariables', value: false },
		{ _id: 'LDAP_Sync_User_Avatar', value: false },

		{ _id: 'LDAP_Background_Sync', value: false },
		{ _id: 'LDAP_Sync_User_Active_State', value: 'none' },
		{ _id: 'LDAP_User_Search_AttributesToQuery', value: '*,+' },
		{ _id: 'LDAP_Sync_AutoLogout_Enabled', value: false },
		{ _id: 'LDAP_Sync_Custom_Fields', value: false },
		{ _id: 'LDAP_Sync_User_Data_Roles', value: false },
		{ _id: 'LDAP_Sync_User_Data_Channels', value: false },
		{ _id: 'LDAP_Enable_LDAP_Groups_To_RC_Teams', value: false },
	];

	await Promise.all(
		settings.map(({ _id, value }) => connection.db().collection<ISetting>('rocketchat_settings').updateOne({ _id }, { $set: { value } })),
	);
};

test.describe('LDAP', () => {
	const container = provideContainerFor('LDAP');

	test.beforeAll(async () => {
		await resetTestData();

		await container.startUp();
	});

	test.afterAll(async () => {
		await container.cleanUp();

		// Remove ldap test users so they don't interfere with other tests
		await resetTestData({ cleanupOnly: true });
	});

	test('Connection Test', async ({ api }) => {
		await test.step('Expect to successfully execute a connection test', async () => {
			expect((await api.post('/ldap.testConnection', {})).status()).toBe(200);
		});
	});

	test('Login using LDAP credentials', async ({ page }) => {
		const poRegistration = new Registration(page);

		await page.goto('/home');

		await poRegistration.username.type('alan.bean');
		await poRegistration.inputPassword.type('ldappassword');
		await poRegistration.btnLogin.click();

		await expect(page.locator('role=heading[name="Welcome to Rocket.Chat"]')).toBeVisible();
	});
});
