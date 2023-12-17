import { settingsRegistry } from '../../app/settings/server';

export const createRateLimitSettings = () =>
	settingsRegistry.addGroup('Rate Limiter', async function () {
		await this.section('DDP_Rate_Limiter', async function () {
			await this.add('DDP_Rate_Limit_IP_Enabled', true, { type: 'boolean' });
			await this.add('DDP_Rate_Limit_IP_Requests_Allowed', 120000, {
				type: 'int',
				enableQuery: { _id: 'DDP_Rate_Limit_IP_Enabled', value: true },
			});
			await this.add('DDP_Rate_Limit_IP_Interval_Time', 60000, {
				type: 'int',
				enableQuery: { _id: 'DDP_Rate_Limit_IP_Enabled', value: true },
			});

			await this.add('DDP_Rate_Limit_User_Enabled', true, { type: 'boolean' });
			await this.add('DDP_Rate_Limit_User_Requests_Allowed', 1200, {
				type: 'int',
				enableQuery: { _id: 'DDP_Rate_Limit_User_Enabled', value: true },
			});
			await this.add('DDP_Rate_Limit_User_Interval_Time', 60000, {
				type: 'int',
				enableQuery: { _id: 'DDP_Rate_Limit_User_Enabled', value: true },
			});

			await this.add('DDP_Rate_Limit_Connection_Enabled', true, { type: 'boolean' });
			await this.add('DDP_Rate_Limit_Connection_Requests_Allowed', 600, {
				type: 'int',
				enableQuery: { _id: 'DDP_Rate_Limit_Connection_Enabled', value: true },
			});
			await this.add('DDP_Rate_Limit_Connection_Interval_Time', 60000, {
				type: 'int',
				enableQuery: { _id: 'DDP_Rate_Limit_Connection_Enabled', value: true },
			});

			await this.add('DDP_Rate_Limit_User_By_Method_Enabled', true, { type: 'boolean' });
			await this.add('DDP_Rate_Limit_User_By_Method_Requests_Allowed', 20, {
				type: 'int',
				enableQuery: { _id: 'DDP_Rate_Limit_User_By_Method_Enabled', value: true },
			});
			await this.add('DDP_Rate_Limit_User_By_Method_Interval_Time', 10000, {
				type: 'int',
				enableQuery: { _id: 'DDP_Rate_Limit_User_By_Method_Enabled', value: true },
			});

			await this.add('DDP_Rate_Limit_Connection_By_Method_Enabled', true, { type: 'boolean' });
			await this.add('DDP_Rate_Limit_Connection_By_Method_Requests_Allowed', 10, {
				type: 'int',
				enableQuery: { _id: 'DDP_Rate_Limit_Connection_By_Method_Enabled', value: true },
			});
			await this.add('DDP_Rate_Limit_Connection_By_Method_Interval_Time', 10000, {
				type: 'int',
				enableQuery: { _id: 'DDP_Rate_Limit_Connection_By_Method_Enabled', value: true },
			});
		});

		await this.section('API_Rate_Limiter', async function () {
			await this.add('API_Enable_Rate_Limiter', true, { type: 'boolean' });
			await this.add('API_Enable_Rate_Limiter_Dev', true, {
				type: 'boolean',
				enableQuery: { _id: 'API_Enable_Rate_Limiter', value: true },
			});
			await this.add('API_Enable_Rate_Limiter_Limit_Calls_Default', 10, {
				type: 'int',
				enableQuery: { _id: 'API_Enable_Rate_Limiter', value: true },
			});
			await this.add('API_Enable_Rate_Limiter_Limit_Time_Default', 60000, {
				type: 'int',
				enableQuery: { _id: 'API_Enable_Rate_Limiter', value: true },
			});
		});

		await this.section('Feature_Limiting', async function () {
			await this.add('Rate_Limiter_Limit_RegisterUser', 1, {
				type: 'int',
				enableQuery: { _id: 'API_Enable_Rate_Limiter', value: true },
			});
		});
	});
