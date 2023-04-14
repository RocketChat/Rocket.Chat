import { onStartup } from '../../../../server/lib/onStartup';
import { settingsRegistry } from '../../../settings/server';

onStartup(async () => {
	await settingsRegistry.addGroup('Accounts', async function () {
		const enableQueryCollectData = { _id: 'Block_Multiple_Failed_Logins_Enabled', value: true };

		await this.section('Login_Attempts', async function () {
			await this.add('Block_Multiple_Failed_Logins_Enabled', false, {
				type: 'boolean',
			});

			await this.add('Block_Multiple_Failed_Logins_By_User', true, {
				type: 'boolean',
				enableQuery: enableQueryCollectData,
			});

			const enableQueryByUser = [enableQueryCollectData, { _id: 'Block_Multiple_Failed_Logins_By_User', value: true }];

			await this.add('Block_Multiple_Failed_Logins_Attempts_Until_Block_by_User', 10, {
				type: 'int',
				enableQuery: enableQueryByUser,
			});

			await this.add('Block_Multiple_Failed_Logins_Time_To_Unblock_By_User_In_Minutes', 5, {
				type: 'int',
				enableQuery: enableQueryByUser,
			});

			await this.add('Block_Multiple_Failed_Logins_By_Ip', true, {
				type: 'boolean',
				enableQuery: enableQueryCollectData,
			});

			const enableQueryByIp = [enableQueryCollectData, { _id: 'Block_Multiple_Failed_Logins_By_Ip', value: true }];

			await this.add('Block_Multiple_Failed_Logins_Attempts_Until_Block_By_Ip', 50, {
				type: 'int',
				enableQuery: enableQueryByIp,
			});

			await this.add('Block_Multiple_Failed_Logins_Time_To_Unblock_By_Ip_In_Minutes', 5, {
				type: 'int',
				enableQuery: enableQueryByIp,
			});

			await this.add('Block_Multiple_Failed_Logins_Ip_Whitelist', '', {
				type: 'string',
				enableQuery: enableQueryByIp,
			});

			await this.add('Block_Multiple_Failed_Logins_Notify_Failed', false, {
				type: 'boolean',
				enableQuery: [enableQueryCollectData],
			});

			await this.add('Block_Multiple_Failed_Logins_Notify_Failed_Channel', '', {
				type: 'string',
				i18nDescription: 'Block_Multiple_Failed_Logins_Notify_Failed_Channel_Desc',
				enableQuery: [enableQueryCollectData, { _id: 'Block_Multiple_Failed_Logins_Notify_Failed', value: true }],
			});
		});

		await this.section('Login_Logs', async function () {
			const enableQueryAudit = { _id: 'Login_Logs_Enabled', value: true };

			await this.add('Login_Logs_Enabled', false, { type: 'boolean' });

			await this.add('Login_Logs_Username', false, { type: 'boolean', enableQuery: enableQueryAudit });

			await this.add('Login_Logs_UserAgent', false, { type: 'boolean', enableQuery: enableQueryAudit });

			await this.add('Login_Logs_ClientIp', false, { type: 'boolean', enableQuery: enableQueryAudit });

			await this.add('Login_Logs_ForwardedForIp', false, {
				type: 'boolean',
				enableQuery: enableQueryAudit,
			});
		});
	});
});
