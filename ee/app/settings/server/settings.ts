import { Meteor } from 'meteor/meteor';

import { SettingsEvents, settings } from '../../../../app/settings/server/functions/settings';
import { isEnterprise, hasLicense, onValidateLicenses } from '../../license/server/license';
import SettingsModel from '../../../../app/models/server/models/Settings';
import { ISetting, SettingValue } from '../../../../definition/ISetting';

export function changeSettingValue(record: ISetting): undefined | { value: SettingValue } {
	if (!record.enterprise) {
		return;
	}

	if (!isEnterprise()) {
		return { value: record.invalidValue };
	}

	if (!record.modules?.length) {
		return;
	}

	for (const moduleName of record.modules) {
		if (!hasLicense(moduleName)) {
			return { value: record.invalidValue };
		}
	}
}

SettingsEvents.on('store-setting-value', (record: ISetting, newRecord: { value: SettingValue }) => {
	const changedValue = changeSettingValue(record);
	if (changedValue) {
		newRecord.value = changedValue.value;
	}
});

SettingsEvents.on('fetch-settings', (settings: Array<ISetting>): void => {
	for (const setting of settings) {
		const changedValue = changeSettingValue(setting);
		if (changedValue) {
			setting.value = changedValue.value;
		}
	}
});

function updateSettings(): void {
	const enterpriseSettings = SettingsModel.findEnterpriseSettings();

	enterpriseSettings.forEach((record: ISetting) => settings.storeSettingValue(record, false));
}


Meteor.startup(() => {
	updateSettings();

	onValidateLicenses(updateSettings);
});
