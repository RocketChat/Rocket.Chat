import { SettingsEvents, settings } from '../../../../app/settings/server/functions/settings';
import { SettingValue, ISettingRecord } from '../../../../app/settings/lib/settings';
import { isEnterprise, hasLicense, onValidateLicenses } from '../../license/server/license';
import SettingsModel from '../../../../app/models/server/models/Settings';

function getSettingValue(record: ISettingRecord): undefined | { value: SettingValue } {
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
	const changedValue = getSettingValue(record);
	if (changedValue) {
		newRecord.value = changedValue.value;
	}
});

SettingsEvents.on('fetch-settings', (settings: Array<ISettingRecord>): void => {
	for (const setting of settings) {
		const changedValue = getSettingValue(setting);
		if (changedValue) {
			setting.value = changedValue.value;
		}
	}
});

onValidateLicenses(() => {
	const enterpriseSettings = SettingsModel.findEnterpriseSettings();

	enterpriseSettings.forEach((record: ISettingRecord) => settings.storeSettingValue(record, false));
});
