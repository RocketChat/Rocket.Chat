import { settingsRegistry } from '../../app/settings/server';

export const createLdapSettings = () =>
	settingsRegistry.addGroup('LDAP', async function () {
		const enableQuery = { _id: 'LDAP_Enable', value: true };
		const adOnly = { _id: 'LDAP_Server_Type', value: 'ad' };
		const ldapOnly = { _id: 'LDAP_Server_Type', value: '' };

		await this.with({ tab: 'LDAP_Connection' }, async function () {
			await this.add('LDAP_Enable', false, { type: 'boolean', public: true });

			await this.add('LDAP_Server_Type', 'ad', {
				type: 'select',
				public: true,
				enableQuery,
				values: [
					{ key: 'ad', i18nLabel: 'LDAP_Server_Type_AD' },
					{ key: '', i18nLabel: 'LDAP_Server_Type_Other' },
				],
			});

			await this.add('LDAP_Host', '', { type: 'string', enableQuery });
			await this.add('LDAP_Port', 389, { type: 'int', enableQuery });
			await this.add('LDAP_Reconnect', false, { type: 'boolean', enableQuery });

			await this.add('LDAP_Login_Fallback', false, { type: 'boolean', enableQuery });

			await this.section('LDAP_Connection_Authentication', async function () {
				const enableAuthentication = [enableQuery, { _id: 'LDAP_Authentication', value: true }];

				await this.add('LDAP_Authentication', false, { type: 'boolean', enableQuery, invalidValue: false });
				await this.add('LDAP_Authentication_UserDN', '', {
					type: 'string',
					enableQuery: enableAuthentication,
					secret: true,
					invalidValue: '',
				});
				await this.add('LDAP_Authentication_Password', '', {
					type: 'password',
					enableQuery: enableAuthentication,
					secret: true,
					invalidValue: '',
				});
			});

			await this.section('LDAP_Connection_Encryption', async function () {
				await this.add('LDAP_Encryption', 'plain', {
					type: 'select',
					values: [
						{ key: 'plain', i18nLabel: 'No_Encryption' },
						{ key: 'tls', i18nLabel: 'StartTLS' },
						{ key: 'ssl', i18nLabel: 'SSL/LDAPS' },
					],
					enableQuery,
				});

				const enableTLSQuery = [enableQuery, { _id: 'LDAP_Encryption', value: { $in: ['tls', 'ssl'] } }];

				await this.add('LDAP_CA_Cert', '', {
					type: 'string',
					multiline: true,
					enableQuery: enableTLSQuery,
					secret: true,
				});
				await this.add('LDAP_Reject_Unauthorized', true, { type: 'boolean', enableQuery: enableTLSQuery });
			});

			await this.section('LDAP_Connection_Timeouts', async function () {
				await this.add('LDAP_Timeout', 60000, { type: 'int', enableQuery });
				await this.add('LDAP_Connect_Timeout', 1000, { type: 'int', enableQuery });
				await this.add('LDAP_Idle_Timeout', 1000, { type: 'int', enableQuery });
			});
		});

		await this.with({ tab: 'LDAP_UserSearch' }, async function () {
			await this.add('LDAP_Find_User_After_Login', true, { type: 'boolean', enableQuery });

			await this.section('LDAP_UserSearch_Filter', async function () {
				await this.add('LDAP_BaseDN', '', {
					type: 'string',
					enableQuery,
				});

				await this.add('LDAP_User_Search_Filter', '(objectclass=*)', {
					type: 'string',
					enableQuery,
				});

				await this.add('LDAP_User_Search_Scope', 'sub', {
					type: 'string',
					enableQuery,
				});

				await this.add('LDAP_AD_User_Search_Field', 'sAMAccountName', {
					i18nLabel: 'LDAP_User_Search_Field',
					i18nDescription: 'LDAP_User_Search_Field_Description',
					type: 'string',
					enableQuery,
					displayQuery: adOnly,
				});
				await this.add('LDAP_User_Search_Field', 'uid', {
					type: 'string',
					enableQuery,
					displayQuery: ldapOnly,
				});
				await this.add('LDAP_Search_Page_Size', 250, {
					type: 'int',
					enableQuery,
				});

				await this.add('LDAP_Search_Size_Limit', 1000, {
					type: 'int',
					enableQuery,
				});
			});

			await this.section('LDAP_UserSearch_GroupFilter', async function () {
				const groupFilterQuery = [enableQuery, { _id: 'LDAP_Group_Filter_Enable', value: true }];

				await this.add('LDAP_Group_Filter_Enable', false, { type: 'boolean', enableQuery });
				await this.add('LDAP_Group_Filter_ObjectClass', 'groupOfUniqueNames', {
					type: 'string',
					enableQuery: groupFilterQuery,
				});
				await this.add('LDAP_Group_Filter_Group_Id_Attribute', 'cn', {
					type: 'string',
					enableQuery: groupFilterQuery,
				});
				await this.add('LDAP_Group_Filter_Group_Member_Attribute', 'uniqueMember', {
					type: 'string',
					enableQuery: groupFilterQuery,
				});
				await this.add('LDAP_Group_Filter_Group_Member_Format', '', {
					type: 'string',
					enableQuery: groupFilterQuery,
				});
				await this.add('LDAP_Group_Filter_Group_Name', 'ROCKET_CHAT', {
					type: 'string',
					enableQuery: groupFilterQuery,
				});
			});
		});

		await this.with({ tab: 'LDAP_DataSync' }, async function () {
			await this.add('LDAP_Unique_Identifier_Field', 'objectGUID,ibm-entryUUID,GUID,dominoUNID,nsuniqueId,uidNumber,uid', {
				type: 'string',
				enableQuery,
			});

			await this.add('LDAP_Merge_Existing_Users', false, {
				type: 'boolean',
				enableQuery,
			});

			await this.add('LDAP_Update_Data_On_Login', true, {
				type: 'boolean',
				enableQuery,
			});

			await this.add('LDAP_Update_Data_On_OAuth_Login', false, {
				type: 'boolean',
				enableQuery: [enableQuery, { _id: 'LDAP_Update_Data_On_Login', value: true }],
			});

			await this.add('LDAP_Default_Domain', '', {
				type: 'string',
				enableQuery,
			});

			await this.section('LDAP_DataSync_DataMap', async function () {
				await this.add('LDAP_AD_Username_Field', 'sAMAccountName', {
					type: 'string',
					enableQuery,
					i18nLabel: 'LDAP_Username_Field',
					i18nDescription: 'LDAP_Username_Field_Description',
					displayQuery: adOnly,
				});

				await this.add('LDAP_Username_Field', 'uid', {
					type: 'string',
					enableQuery,
					displayQuery: ldapOnly,
				});

				await this.add('LDAP_AD_Email_Field', 'mail', {
					i18nLabel: 'LDAP_Email_Field',
					i18nDescription: 'LDAP_Email_Field_Description',
					type: 'string',
					enableQuery,
					displayQuery: adOnly,
				});

				await this.add('LDAP_Email_Field', 'mail', {
					type: 'string',
					enableQuery,
					displayQuery: ldapOnly,
				});

				await this.add('LDAP_AD_Name_Field', 'cn', {
					i18nLabel: 'LDAP_Name_Field',
					i18nDescription: 'LDAP_Name_Field_Description',
					type: 'string',
					enableQuery,
					displayQuery: adOnly,
				});

				await this.add('LDAP_Name_Field', 'cn', {
					type: 'string',
					enableQuery,
					displayQuery: ldapOnly,
				});

				await this.add('LDAP_Extension_Field', '', {
					type: 'string',
					enableQuery,
				});
			});

			await this.section('LDAP_DataSync_Avatar', async function () {
				await this.add('LDAP_Sync_User_Avatar', true, {
					type: 'boolean',
					enableQuery,
				});

				await this.add('LDAP_Avatar_Field', '', {
					type: 'string',
					enableQuery,
				});
			});
		});
	});
