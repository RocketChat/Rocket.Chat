import moment from 'moment-timezone';

import { settingsRegistry } from '../../app/settings/server';

export const smarshIntervalValuesToCronMap: Record<string, string> = {
	every_30_seconds: '*/30 * * * * *',
	every_30_minutes: '*/30 * * * *',
	every_1_hours: '0 * * * *',
	every_6_hours: '0 */6 * * *',
};

export const createSmarshSettings = () =>
	settingsRegistry.addGroup('Smarsh', async function addSettings() {
		await this.add('Smarsh_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Smarsh_Enabled',
			enableQuery: {
				_id: 'From_Email',
				value: {
					$exists: 1,
					$ne: '',
				},
			},
		});
		await this.add('Smarsh_Email', '', {
			type: 'string',
			i18nLabel: 'Smarsh_Email',
			placeholder: 'email@domain.com',
			secret: true,
		});
		await this.add('Smarsh_MissingEmail_Email', 'no-email@example.com', {
			type: 'string',
			i18nLabel: 'Smarsh_MissingEmail_Email',
			placeholder: 'no-email@example.com',
		});

		const zoneValues = moment.tz.names().map(function _timeZonesToSettings(name) {
			return {
				key: name,
				i18nLabel: name,
			};
		});
		await this.add('Smarsh_Timezone', 'America/Los_Angeles', {
			type: 'select',
			values: zoneValues,
		});

		await this.add('Smarsh_Interval', 'every_30_minutes', {
			type: 'select',
			values: [
				{
					key: 'every_30_seconds',
					i18nLabel: 'every_30_seconds',
				},
				{
					key: 'every_30_minutes',
					i18nLabel: 'every_30_minutes',
				},
				{
					key: 'every_1_hours',
					i18nLabel: 'every_hour',
				},
				{
					key: 'every_6_hours',
					i18nLabel: 'every_six_hours',
				},
			],
			enableQuery: {
				_id: 'From_Email',
				value: {
					$exists: 1,
					$ne: '',
				},
			},
		});
	});
