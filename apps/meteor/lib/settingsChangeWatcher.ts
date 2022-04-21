import farmhash from 'farmhash';
import { ServerEventType, SettingValue } from '@rocket.chat/core-typings';

import { ServerEvents } from '../app/models/server/raw';
import { settings } from '../app/settings/server';
import { Logger } from '../app/logger/server';
import { serverEvents } from './serverEvents';

const logger = new Logger('SettingChangeWatcher');

export const storeSettingChanged = async (settingId: string, targetValue: SettingValue, uid = 'system'): Promise<void> => {
	const currentSetting = settings.getSetting(settingId);
	if (!currentSetting) {
		logger.debug(`Setting with ID ${settingId} not found on registry`);
		return;
	}

	if (currentSetting.value === targetValue) {
		logger.debug(`Cannot store change metadata for ${settingId}. Setting didn't change`);
		return;
	}

	if (currentSetting.nonAuditable) {
		logger.debug(`Updating non-auditable setting ${settingId}. Event won't be stored`);
		return;
	}

	const event = {
		t: ServerEventType.SETTING_MODIFIED,
		ts: new Date(),
		indexHash: farmhash.fingerprint64(settingId),
		u: {
			_id: uid,
		},
		extraData: {
			settingId,
			prevValue: currentSetting.value,
			targetValue,
		},
	};

	try {
		await ServerEvents.insertOne(event);
		logger.debug(`Setting ${settingId} changed by ${uid}`);
	} catch (err) {
		logger.error({ msg: 'An error ocurred while storing setting audit metadata', err, settingId });
	}
};

serverEvents.addEventListener(ServerEventType.SETTING_MODIFIED, storeSettingChanged);
