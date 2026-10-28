import type { IAppServerOrchestrator, IAppSettingsConverter, IAppsSetting } from '@rocket.chat/apps';
import type { ISetting } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import * as z from 'zod';

import { SettingCodec } from './codecs';

export class AppSettingsConverter implements IAppSettingsConverter {
	constructor(protected readonly orch: IAppServerOrchestrator) {
		this.orch = orch;
	}

	async convertById(settingId: ISetting['_id']): Promise<IAppsSetting> {
		const setting = await Settings.findOneById(settingId);

		return this.convertToApp(setting as ISetting);
	}

	convertToApp(setting: ISetting): IAppsSetting {
		return z.decode(SettingCodec, setting);
	}
}
