import type { IRoom } from '@rocket.chat/core-typings';

type RoomSettings = {
	roomAvatar: unknown;
	featured: unknown;
	roomName: unknown;
	roomTopic: unknown;
	roomAnnouncement: unknown;
	roomCustomFields: unknown;
	roomDescription: unknown;
	roomType: unknown;
	readOnly: unknown;
	reactWhenReadOnly: unknown;
	systemMessages: unknown;
	default: unknown;
	joinCode: unknown;
	tokenpass: unknown;
	streamingOptions: unknown;
	retentionEnabled: unknown;
	retentionMaxAge: unknown;
	retentionExcludePinned: unknown;
	retentionFilesOnly: unknown;
	retentionIgnoreThreads: unknown;
	retentionOverrideGlobal: unknown;
	encrypted: boolean;
	favorite: unknown;
};

export type SaveRoomSettingsMethod = {
	(rid: IRoom['_id'], settings: Partial<RoomSettings>): { result: true; rid: IRoom['_id'] };
	<RoomSettingName extends keyof RoomSettings>(rid: IRoom['_id'], setting: RoomSettingName, value: RoomSettings[RoomSettingName]): {
		result: true;
		rid: IRoom['_id'];
	};
};
