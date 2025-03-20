import { settingsRegistry } from '../../app/settings/server';

export const createLogSettings = () =>
	settingsRegistry.addGroup('Logs', async function () {
		await this.add('Log_Level', '0', {
			type: 'select',
			values: [
				{
					key: '0',
					i18nLabel: '0_Errors_Only',
				},
				{
					key: '1',
					i18nLabel: '1_Errors_and_Information',
				},
				{
					key: '2',
					i18nLabel: '2_Erros_Information_and_Debug',
				},
			],
			public: true,
		});
		await this.add('Log_View_Limit', 1000, {
			type: 'int',
		});

		await this.add('Log_Trace_Methods', false, {
			type: 'boolean',
		});

		await this.add('Log_Trace_Methods_Filter', '', {
			type: 'string',
			enableQuery: {
				_id: 'Log_Trace_Methods',
				value: true,
			},
		});

		await this.add('Log_Trace_Subscriptions', false, {
			type: 'boolean',
		});

		await this.add('Log_Trace_Subscriptions_Filter', '', {
			type: 'string',
			enableQuery: {
				_id: 'Log_Trace_Subscriptions',
				value: true,
			},
		});

		await this.add('Uncaught_Exceptions_Count', 0, {
			hidden: true,
			type: 'int',
		});

		await this.section('Prometheus', async function () {
			await this.add('Prometheus_Enabled', false, {
				type: 'boolean',
				i18nLabel: 'Enabled',
			});
			// See the default port allocation at https://github.com/prometheus/prometheus/wiki/Default-port-allocations
			await this.add('Prometheus_Port', 9458, {
				type: 'int',
				i18nLabel: 'Port',
			});
			await this.add('Prometheus_Reset_Interval', 0, {
				type: 'int',
			});
			await this.add('Prometheus_Garbage_Collector', false, {
				type: 'boolean',
				alert: 'Prometheus_Garbage_Collector_Alert',
			});
			await this.add('Prometheus_API_User_Agent', false, {
				type: 'boolean',
			});
		});

		await this.add('Log_Exceptions_to_Channel', '', { type: 'string' });
	});
