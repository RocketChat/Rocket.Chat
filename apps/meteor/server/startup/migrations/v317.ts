import type { ILoginServiceConfiguration, OAuthConfiguration } from '@rocket.chat/core-typings';
import { Settings, LoginServiceConfiguration } from '@rocket.chat/models';

import { isTruthy } from '../../../lib/isTruthy';
import { SystemLogger } from '../../lib/logger/system';
import { addMigration } from '../../lib/migrations';

const newDefaultButtonColor = '#e4e7ea';
const newDefaultButtonLabelColor = '#1f2329';

const settingsToUpdate = [
	// button background colors
	{ key: 'SAML_Custom_Default_button_color', defaultValue: '#1d74f5', newValue: newDefaultButtonColor },
	{ key: 'CAS_button_color', defaultValue: '#1d74f5', newValue: newDefaultButtonColor },
	{ key: 'Accounts_OAuth_Nextcloud_button_color', defaultValue: '#0082c9', newValue: newDefaultButtonColor },
	{ key: 'Accounts_OAuth_Dolphin_button_color', defaultValue: '#1d74f5', newValue: newDefaultButtonColor },
	// button label colors
	{ key: 'SAML_Custom_Default_button_label_color', defaultValue: '#1d74f5', newValue: newDefaultButtonLabelColor },
	{ key: 'CAS_button_label_color', defaultValue: '#1d74f5', newValue: newDefaultButtonLabelColor },
	{ key: 'Accounts_OAuth_Nextcloud_button_label_color', defaultValue: '#1d74f5', newValue: newDefaultButtonLabelColor },
	{ key: 'Accounts_OAuth_Dolphin_button_label_color', defaultValue: '#1d74f5', newValue: newDefaultButtonLabelColor },
];

const getSettingValue = async (key: string) => Settings.getValueById(key);

async function updateOAuthServices(): Promise<void> {
	const services = await Settings.find({ _id: { $regex: /^(Accounts_OAuth_|Accounts_OAuth_Custom-)[a-z0-9_]+$/i } }).toArray();
	const filteredServices = services.filter(({ value }) => typeof value === 'boolean');
	for await (const { _id: key, value } of filteredServices) {
		if (value !== true) {
			continue;
		}

		let serviceName = key.replace('Accounts_OAuth_', '');
		if (serviceName === 'Meteor') {
			serviceName = 'meteor-developer';
		}
		if (/Accounts_OAuth_Custom-/.test(key)) {
			serviceName = key.replace('Accounts_OAuth_Custom-', '');
		}

		const serviceKey = serviceName.toLowerCase();

		const data: Partial<ILoginServiceConfiguration & Omit<OAuthConfiguration, '_id'>> = {};

		if (/Accounts_OAuth_Custom-/.test(key)) {
			data.buttonLabelColor = (await getSettingValue(`${key}-button_label_color`)) as string;
			data.buttonColor = (await getSettingValue(`${key}-button_color`)) as string;
		}

		if (serviceName === 'Nextcloud') {
			data.buttonLabelColor = (await getSettingValue('Accounts_OAuth_Nextcloud_button_label_color')) as string;
			data.buttonColor = (await getSettingValue('Accounts_OAuth_Nextcloud_button_color')) as string;
		}

		await LoginServiceConfiguration.createOrUpdateService(serviceKey, data);
	}
}

addMigration({
	version: 317,
	name: 'Change default color of OAuth login services buttons',
	async up() {
		// TODO: audit
		const promises = settingsToUpdate
			.map(async ({ key, defaultValue, newValue }) => {
				const oldSettingValue = await getSettingValue(key);

				if (!oldSettingValue || oldSettingValue !== defaultValue) {
					return;
				}

				SystemLogger.warn(`The default value of the setting ${key} has changed to ${newValue}. Please review your settings.`);

				return Settings.updateOne({ _id: key }, { $set: { value: newValue } });
			})
			.filter(isTruthy);

		await Promise.all(promises);

		const customOAuthButtonColors = await Settings.find({
			_id: { $regex: /^Accounts_OAuth_Custom-[a-zA-Z0-9_-]+-button_color$/ },
		}).toArray();
		const customOAuthButtonLabelColors = await Settings.find({
			_id: { $regex: /^Accounts_OAuth_Custom-[a-zA-Z0-9_-]+-button_label_color$/ },
		}).toArray();

		const buttonColorPromises = customOAuthButtonColors
			.map(({ _id, value, packageValue }) => {
				if (packageValue !== value) {
					return;
				}

				SystemLogger.warn(
					`The default value of the custom setting ${_id} has changed to ${newDefaultButtonColor}. Please review your settings.`,
				);

				return Settings.updateOne({ _id }, { $set: { value: newDefaultButtonColor } });
			})
			.filter(isTruthy);

		const buttonLabelColorPromises = customOAuthButtonLabelColors
			.map(({ _id, value, packageValue }) => {
				if (packageValue !== value) {
					return;
				}

				SystemLogger.warn(
					`The default value of the custom setting ${_id} has changed to ${newDefaultButtonLabelColor}. Please review your settings.`,
				);

				return Settings.updateOne({ _id }, { $set: { value: newDefaultButtonLabelColor } });
			})
			.filter(isTruthy);

		await Promise.all([...buttonColorPromises, ...buttonLabelColorPromises]);
		// update login service configurations
		await updateOAuthServices();
	},
});
