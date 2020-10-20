import { Meteor } from 'meteor/meteor';

import { SettingsEvents, settings, ISettingRecord } from '../../../../app/settings/server/functions/settings';
import { SettingValue } from '../../../../app/settings/lib/settings';
import { isEnterprise, hasLicense, onValidateLicenses } from '../../license/server/license';
import SettingsModel from '../../../../app/models/server/models/Settings';

function changeSettingValue(record: ISettingRecord): undefined | { value: SettingValue } {
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

SettingsEvents.on('store-setting-value', (record: ISettingRecord, newRecord: { value: SettingValue }) => {
	const changedValue = changeSettingValue(record);
	if (changedValue) {
		newRecord.value = changedValue.value;
	}
});

SettingsEvents.on('fetch-settings', (settings: Array<ISettingRecord>): void => {
	for (const setting of settings) {
		const changedValue = changeSettingValue(setting);
		if (changedValue) {
			setting.value = changedValue.value;
		}
	}
});

type ISettingNotificationValue = {
	_id: string;
	value: SettingValue;
	editor: string;
	properties: string;
	enterprise: boolean;
};

SettingsEvents.on('change-setting', (record: ISettingRecord, value: ISettingNotificationValue): void => {
	const changedValue = changeSettingValue(record);
	if (changedValue) {
		value.value = changedValue.value;
	}
});

function updateSettings(): void {
	const enterpriseSettings = SettingsModel.findEnterpriseSettings();

	enterpriseSettings.forEach((record: ISettingRecord) => settings.storeSettingValue(record, false));
}


Meteor.startup(() => {
	updateSettings();

	onValidateLicenses(updateSettings);
});
