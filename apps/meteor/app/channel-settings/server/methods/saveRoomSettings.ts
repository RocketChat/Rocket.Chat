import { Team } from '@rocket.chat/core-services';
import type { IRoom, IRoomWithRetentionPolicy, IUser, MessageTypesValues } from '@rocket.chat/core-typings';
import { TEAM_TYPE, isValidSidepanel } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms, Users } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { RoomSettingsEnum } from '../../../../definition/IRoomTypeConfig';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { setRoomAvatar } from '../../../lib/server/functions/setRoomAvatar';
import { notifyOnRoomChangedById } from '../../../lib/server/lib/notifyListener';
import { saveReactWhenReadOnly } from '../functions/saveReactWhenReadOnly';
import { saveRoomAnnouncement } from '../functions/saveRoomAnnouncement';
import { saveRoomCustomFields } from '../functions/saveRoomCustomFields';
import { saveRoomDescription } from '../functions/saveRoomDescription';
import { saveRoomEncrypted } from '../functions/saveRoomEncrypted';
import { saveRoomName } from '../functions/saveRoomName';
import { saveRoomReadOnly } from '../functions/saveRoomReadOnly';
import { saveRoomSystemMessages } from '../functions/saveRoomSystemMessages';
import { saveRoomTopic } from '../functions/saveRoomTopic';
import { saveRoomType } from '../functions/saveRoomType';

type RoomSettings = {
	roomAvatar: string;
	featured: boolean;
	roomName: string | undefined;
	roomTopic: string;
	roomAnnouncement: string;
	roomCustomFields: Record<string, any>;
	roomDescription: string;
	roomType: IRoom['t'];
	readOnly: boolean;
	reactWhenReadOnly: boolean;
	systemMessages: MessageTypesValues[];
	default: boolean;
	joinCode: string;
	retentionEnabled: boolean;
	retentionMaxAge: number;
	retentionExcludePinned: boolean;
	retentionFilesOnly: boolean;
	retentionIgnoreThreads: boolean;
	retentionOverrideGlobal: boolean;
	encrypted: boolean;
	favorite: {
		favorite: boolean;
		defaultValue: boolean;
	};
	sidepanel?: IRoom['sidepanel'];
};

type RoomSettingsValidators = {
	[TRoomSetting in keyof RoomSettings]?: (params: {
		userId: IUser['_id'];
		value: RoomSettings[TRoomSetting];
		room: IRoom;
		rid: IRoom['_id'];
	}) => Promise<void> | void;
};

const hasRetentionPolicy = (room: IRoom & { retention?: any }): room is IRoomWithRetentionPolicy =>
	'retention' in room && room.retention !== undefined;

const validators: RoomSettingsValidators = {
	async default({ userId }) {
		if (!(await hasPermissionAsync(userId, 'view-room-administration'))) {
			throw new Meteor.Error('error-action-not-allowed', 'Viewing room administration is not allowed', {
				method: 'saveRoomSettings',
				action: 'Viewing_room_administration',
			});
		}
	},
	async featured({ userId }) {
		if (!(await hasPermissionAsync(userId, 'view-room-administration'))) {
			throw new Meteor.Error('error-action-not-allowed', 'Viewing room administration is not allowed', {
				method: 'saveRoomSettings',
				action: 'Viewing_room_administration',
			});
		}
	},
	async sidepanel({ room, userId, value }) {
		if (!room.teamMain) {
			throw new Meteor.Error('error-action-not-allowed', 'Invalid room', {
				method: 'saveRoomSettings',
			});
		}

		if (!(await hasPermissionAsync(userId, 'edit-team', room._id))) {
			throw new Meteor.Error('error-action-not-allowed', 'You do not have permission to change sidepanel items', {
				method: 'saveRoomSettings',
			});
		}

		if (!isValidSidepanel(value)) {
			throw new Meteor.Error('error-invalid-sidepanel');
		}
	},

	async roomType({ userId, room, value }) {
		if (value === room.t) {
			return;
		}

		if (value === 'c' && !(await hasPermissionAsync(userId, 'create-c'))) {
			throw new Meteor.Error('error-action-not-allowed', 'Changing a private group to a public channel is not allowed', {
				method: 'saveRoomSettings',
				action: 'Change_Room_Type',
			});
		}

		if (value === 'p' && !(await hasPermissionAsync(userId, 'create-p'))) {
			throw new Meteor.Error('error-action-not-allowed', 'Changing a public channel to a private room is not allowed', {
				method: 'saveRoomSettings',
				action: 'Change_Room_Type',
			});
		}
	},
	async encrypted({ userId, value, room, rid }) {
		if (value !== room.encrypted) {
			if (!(await roomCoordinator.getRoomDirectives(room.t).allowRoomSettingChange(room, RoomSettingsEnum.E2E))) {
				throw new Meteor.Error('error-action-not-allowed', 'Only groups or direct channels can enable encryption', {
					method: 'saveRoomSettings',
					action: 'Change_Room_Encrypted',
				});
			}

			if (room.t !== 'd' && !(await hasPermissionAsync(userId, 'toggle-room-e2e-encryption', rid))) {
				throw new Meteor.Error('error-action-not-allowed', 'You do not have permission to toggle E2E encryption', {
					method: 'saveRoomSettings',
					action: 'Change_Room_Encrypted',
				});
			}
		}
	},
	async retentionEnabled({ userId, value, room, rid }) {
		if (
			!(await hasPermissionAsync(userId, 'edit-room-retention-policy', rid)) &&
			(!hasRetentionPolicy(room) || value !== room.retention.enabled)
		) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	async retentionMaxAge({ userId, value, room, rid }) {
		if (
			!(await hasPermissionAsync(userId, 'edit-room-retention-policy', rid)) &&
			(!hasRetentionPolicy(room) || value !== room.retention.maxAge)
		) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	async retentionExcludePinned({ userId, value, room, rid }) {
		if (
			!(await hasPermissionAsync(userId, 'edit-room-retention-policy', rid)) &&
			(!hasRetentionPolicy(room) || value !== room.retention.excludePinned)
		) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	async retentionFilesOnly({ userId, value, room, rid }) {
		if (
			!(await hasPermissionAsync(userId, 'edit-room-retention-policy', rid)) &&
			(!hasRetentionPolicy(room) || value !== room.retention.filesOnly)
		) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	async retentionIgnoreThreads({ userId, value, room, rid }) {
		if (
			!(await hasPermissionAsync(userId, 'edit-room-retention-policy', rid)) &&
			(!hasRetentionPolicy(room) || value !== room.retention.ignoreThreads)
		) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	async roomAvatar({ userId, rid }) {
		if (!(await hasPermissionAsync(userId, 'edit-room-avatar', rid))) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing a room avatar is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
};

type RoomSettingsSavers = {
	[TRoomSetting in keyof RoomSettings]?: (params: {
		userId: IUser['_id'];
		user: IUser & Required<Pick<IUser, 'username' | 'name'>>;
		value: RoomSettings[TRoomSetting];
		room: IRoom;
		rid: IRoom['_id'];
	}) => void | Promise<void>;
};

const settingSavers: RoomSettingsSavers = {
	async roomName({ value, rid, user, room }) {
		if (!(await saveRoomName(rid, value, user))) {
			return;
		}

		if (room.teamId && room.teamMain) {
			void Team.update(user._id, room.teamId, {
				type: room.t === 'c' ? TEAM_TYPE.PUBLIC : TEAM_TYPE.PRIVATE,
				name: value,
				updateRoom: false,
			});
		}
	},
	async roomTopic({ value, room, rid, user }) {
		if (!value && !room.topic) {
			return;
		}
		if (value !== room.topic) {
			await saveRoomTopic(rid, value, user);
		}
	},
	async sidepanel({ value, rid, room }) {
		if (JSON.stringify(value) !== JSON.stringify(room.sidepanel)) {
			await Rooms.setSidepanelById(rid, value);
		}
	},
	async roomAnnouncement({ value, room, rid, user }) {
		if (!value && !room.announcement) {
			return;
		}
		if (value !== room.announcement) {
			await saveRoomAnnouncement(rid, value, user);
		}
	},
	async roomCustomFields({ value, room, rid }) {
		if (value !== room.customFields) {
			await saveRoomCustomFields(rid, value);
		}
	},
	async roomDescription({ value, room, rid, user }) {
		if (!value && !room.description) {
			return;
		}
		if (value !== room.description) {
			await saveRoomDescription(rid, value, user);
		}
	},
	async roomType({ value, room, rid, user }) {
		if (value === room.t) {
			return;
		}

		if (!(await saveRoomType(rid, value, user))) {
			return;
		}

		if (room.teamId && room.teamMain) {
			const type = value === 'c' ? TEAM_TYPE.PUBLIC : TEAM_TYPE.PRIVATE;
			void Team.update(user._id, room.teamId, { type, updateRoom: false });
		}
	},
	async readOnly({ value, room, rid, user }) {
		if (value !== room.ro) {
			await saveRoomReadOnly(rid, value, user);
		}
	},
	async reactWhenReadOnly({ value, room, rid, user }) {
		if (value !== room.reactWhenReadOnly) {
			await saveReactWhenReadOnly(rid, value, user);
		}
	},
	async systemMessages({ value, room, rid }) {
		if (JSON.stringify(value) !== JSON.stringify(room.sysMes)) {
			await saveRoomSystemMessages(rid, value);
		}
	},
	async joinCode({ value, rid }) {
		await Rooms.setJoinCodeById(rid, String(value));
	},
	async default({ value, rid }) {
		await Rooms.saveDefaultById(rid, value);
	},
	async featured({ value, rid }) {
		await Rooms.saveFeaturedById(rid, value);
	},
	async retentionEnabled({ value, rid }) {
		await Rooms.saveRetentionEnabledById(rid, value);
	},
	async retentionMaxAge({ value, rid }) {
		await Rooms.saveRetentionMaxAgeById(rid, value);
	},
	async retentionExcludePinned({ value, rid }) {
		await Rooms.saveRetentionExcludePinnedById(rid, value);
	},
	async retentionFilesOnly({ value, rid }) {
		await Rooms.saveRetentionFilesOnlyById(rid, value);
	},
	async retentionIgnoreThreads({ value, rid }) {
		await Rooms.saveRetentionIgnoreThreadsById(rid, value);
	},
	async retentionOverrideGlobal({ value, rid }) {
		await Rooms.saveRetentionOverrideGlobalById(rid, value);
	},
	async encrypted({ value, room, rid, user }) {
		await saveRoomEncrypted(rid, value, user, Boolean(room.encrypted) !== Boolean(value));
	},
	async favorite({ value, rid }) {
		await Rooms.saveFavoriteById(rid, value.favorite, value.defaultValue);
	},
	async roomAvatar({ value, rid, user }) {
		await setRoomAvatar(rid, value, user);
	},
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		saveRoomSettings(rid: IRoom['_id'], settings: Partial<RoomSettings>): Promise<{ result: true; rid: IRoom['_id'] }>;
		saveRoomSettings<RoomSettingName extends keyof RoomSettings>(
			rid: IRoom['_id'],
			setting: RoomSettingName,
			value: RoomSettings[RoomSettingName],
		): Promise<{ result: true; rid: IRoom['_id'] }>;
	}
}

const fields: (keyof RoomSettings)[] = [
	'roomAvatar',
	'featured',
	'roomName',
	'roomTopic',
	'roomAnnouncement',
	'roomCustomFields',
	'roomDescription',
	'roomType',
	'readOnly',
	'reactWhenReadOnly',
	'systemMessages',
	'default',
	'joinCode',
	'retentionEnabled',
	'retentionMaxAge',
	'retentionExcludePinned',
	'retentionFilesOnly',
	'retentionIgnoreThreads',
	'retentionOverrideGlobal',
	'encrypted',
	'favorite',
	'sidepanel',
];

const validate = <TRoomSetting extends keyof RoomSettings>(
	setting: TRoomSetting,
	params: {
		userId: IUser['_id'];
		value: RoomSettings[TRoomSetting];
		room: IRoom;
		rid: IRoom['_id'];
	},
) => {
	const validator = validators[setting];
	return validator?.(params);
};

async function save<TRoomSetting extends keyof RoomSettings>(
	setting: TRoomSetting,
	params: {
		userId: IUser['_id'];
		user: IUser & Required<Pick<IUser, 'username' | 'name'>>;
		value: RoomSettings[TRoomSetting];
		room: IRoom;
		rid: IRoom['_id'];
	},
) {
	const saver = settingSavers[setting];
	await saver?.(params);
}

export async function saveRoomSettings(
	userId: IUser['_id'],
	rid: IRoom['_id'],
	settings: Partial<RoomSettings>,
): Promise<{ result: true; rid: IRoom['_id'] }>;
export async function saveRoomSettings<RoomSettingName extends keyof RoomSettings>(
	userId: IUser['_id'],
	rid: IRoom['_id'],
	setting: RoomSettingName,
	value: RoomSettings[RoomSettingName],
): Promise<{ result: true; rid: IRoom['_id'] }>;
export async function saveRoomSettings(
	userId: IUser['_id'],
	rid: IRoom['_id'],
	settings: Partial<RoomSettings> | keyof RoomSettings,
	value?: RoomSettings[keyof RoomSettings],
): Promise<{ result: true; rid: IRoom['_id'] }> {
	if (!userId) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			function: 'RocketChat.saveRoomName',
		});
	}
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'saveRoomSettings',
		});
	}

	if (typeof settings !== 'object') {
		settings = {
			[settings]: value,
		};
	}

	if (!Object.keys(settings).every((key) => fields.includes(key as keyof typeof settings))) {
		throw new Meteor.Error('error-invalid-settings', 'Invalid settings provided', {
			method: 'saveRoomSettings',
		});
	}

	const room = await Rooms.findOneById(rid);

	if (!room) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room', {
			method: 'saveRoomSettings',
		});
	}

	if (!(await hasPermissionAsync(userId, 'edit-room', rid))) {
		if (!(Object.keys(settings).includes('encrypted') && room.t === 'd')) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
		settings = { encrypted: settings.encrypted };
	}

	if (room.broadcast && (settings.readOnly || settings.reactWhenReadOnly)) {
		throw new Meteor.Error('error-action-not-allowed', 'Editing readOnly/reactWhenReadOnly are not allowed for broadcast rooms', {
			method: 'saveRoomSettings',
			action: 'Editing_room',
		});
	}

	const user = await Users.findOneById(userId, { projection: { username: 1, name: 1 } });
	if (!user) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user', {
			method: 'saveRoomSettings',
		});
	}

	// validations
	for await (const setting of Object.keys(settings) as (keyof RoomSettings)[]) {
		await validate(setting, {
			userId,
			value: settings[setting],
			room,
			rid,
		});

		if (setting === 'retentionOverrideGlobal' && settings.retentionOverrideGlobal === false) {
			delete settings.retentionMaxAge;
			delete settings.retentionExcludePinned;
			delete settings.retentionFilesOnly;
			delete settings.retentionIgnoreThreads;
		}
	}

	// saving data
	for await (const setting of Object.keys(settings) as (keyof RoomSettings)[]) {
		await save(setting, {
			userId,
			user: user as IUser & Required<Pick<IUser, 'username' | 'name'>>,
			value: settings[setting],
			room,
			rid,
		});
	}

	void notifyOnRoomChangedById(rid);

	return {
		result: true,
		rid: room._id,
	};
}

Meteor.methods<ServerMethods>({
	saveRoomSettings: (...args) => {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				function: 'RocketChat.saveRoomName',
			});
		}

		return saveRoomSettings(userId, ...args);
	},
});
