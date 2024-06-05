import type { MessageTypesValues, SettingValue } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import mem from 'mem';

export const isMutedUnmuted = (messageType: string): boolean => {
	return messageType === 'user-muted' || messageType === 'user-unmuted';
};

const getSettingCached = mem(async (setting: string): Promise<SettingValue> => Settings.getValueById(setting), { maxAge: 10000 });

export const getCachedHiddenSystemMessage = async () => {
	return getSettingCached('Hide_System_Messages') as unknown as MessageTypesValues[];
};

export const shouldHideSystemMessage = async (messageType: MessageTypesValues): Promise<boolean> => {
	const hideSystemMessage = await getCachedHiddenSystemMessage();

	if (!hideSystemMessage?.length) {
		return false;
	}

	return hideSystemMessage.includes(messageType) || (isMutedUnmuted(messageType) && hideSystemMessage.includes('mute_unmute'));
};
