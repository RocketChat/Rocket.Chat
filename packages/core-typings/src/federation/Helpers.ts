import type { IRoom } from '../IRoom';
import { isDirectMessageRoom, isRoomFederated } from '../IRoom';
import { RoomSettingsEnum } from '../IRoomConfig';
import type { ValueOf } from '../utils';

const allowedRoomSettingsChangesInFederatedRooms: ValueOf<typeof RoomSettingsEnum>[] = [RoomSettingsEnum.NAME, RoomSettingsEnum.TOPIC];

export const isAFederatedUsername = (username: string): boolean => username.includes('@') && username.includes(':');
export const escapeExternalFederationEventId = (externalEventId: string): string => externalEventId.replace(/\$/g, '__sign__');
export const unescapeExternalFederationEventId = (externalEventId: string): string => externalEventId.replace(/__sign__/g, '$');
export const isSettingAllowedInAFederatedRoom = (room: Partial<IRoom>, setting: ValueOf<typeof RoomSettingsEnum>): boolean => {
	if (!isRoomFederated(room)) {
		return false;
	}

	if (isDirectMessageRoom(room)) {
		return false;
	}
	return allowedRoomSettingsChangesInFederatedRooms.includes(setting);
};
