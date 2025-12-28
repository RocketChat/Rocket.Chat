import { AppMethod } from '../../definition/metadata';
import type { ISetting } from '../../definition/settings';
import type { ISettingUpdateContext } from '../../definition/settings/ISettingUpdateContext';
import type { AppManager } from '../AppManager';
import { Utilities } from '../misc/Utilities';

export class AppSettingsManager {
	constructor(private manager: AppManager) {}

	public getAppSettings(appId: string): { [key: string]: ISetting } {
		const rl = this.manager.getOneById(appId);

		if (!rl) {
			throw new Error('No App found by the provided id.');
		}

		return Utilities.deepCloneAndFreeze(rl.getStorageItem().settings);
	}

	public getAppSetting(appId: string, settingId: string): ISetting {
		const settings = this.getAppSettings(appId);

		if (!settings[settingId]) {
			throw new Error('No setting found for the App by the provided id.');
		}

		return Utilities.deepCloneAndFreeze(settings[settingId]);
	}

	public async updateAppSetting(appId: string, setting: ISetting): Promise<void> {
		const rl = this.manager.getOneById(appId);

		if (!rl) {
			throw new Error('No App found by the provided id.');
		}

		const storageItem = rl.getStorageItem();

		const oldSetting = storageItem.settings[setting.id];
		if (!oldSetting) {
			throw new Error('No setting found for the App by the provided id.');
		}

		const decoratedSetting =
			(await rl.call(AppMethod.ON_PRE_SETTING_UPDATE, { oldSetting, newSetting: setting } as ISettingUpdateContext)) || setting;

		decoratedSetting.updatedAt = new Date();
		storageItem.settings[decoratedSetting.id] = decoratedSetting;

		await this.manager.getStorage().updateSetting(storageItem._id, decoratedSetting);

		this.manager.getBridges().getAppDetailChangesBridge().doOnAppSettingsChange(appId, decoratedSetting);

		await rl.call(AppMethod.ONSETTINGUPDATED, decoratedSetting);
	}
}
