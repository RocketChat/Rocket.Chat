import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import type { IRoom, RoomType, IRoomWithRetentionPolicy, IUser } from '@rocket.chat/core-typings';
import { TEAM_TYPE } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import { setRoomAvatar } from '../../../lib/server/functions/setRoomAvatar';
import { hasPermission } from '../../../authorization/server';
import { callbacks } from '../../../../lib/callbacks';
import { saveRoomName } from '../functions/saveRoomName';
import { saveRoomTopic } from '../functions/saveRoomTopic';
import { saveRoomAnnouncement } from '../functions/saveRoomAnnouncement';
import { saveRoomCustomFields } from '../functions/saveRoomCustomFields';
import { saveRoomDescription } from '../functions/saveRoomDescription';
import { saveRoomType } from '../functions/saveRoomType';
import { saveRoomReadOnly } from '../functions/saveRoomReadOnly';
import { saveReactWhenReadOnly } from '../functions/saveReactWhenReadOnly';
import { saveRoomSystemMessages } from '../functions/saveRoomSystemMessages';
import { saveRoomEncrypted } from '../functions/saveRoomEncrypted';
import { saveStreamingOptions } from '../functions/saveStreamingOptions';
import { Team } from '../../../../server/sdk';
import { roomCoordinator } from '../../../../server/lib/rooms/roomCoordinator';
import { RoomSettingsEnum } from '../../../../definition/IRoomTypeConfig';
import { saveFavoriteRoom } from '../functions/saveFavoriteRoom';

const fields = [
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
	'streamingOptions',
	'retentionEnabled',
	'retentionMaxAge',
	'retentionExcludePinned',
	'retentionFilesOnly',
	'retentionIgnoreThreads',
	'retentionOverrideGlobal',
	'encrypted',
	'favorite',
];

const hasRetentionPolicy = (room: IRoom & { retention?: any }): room is IRoomWithRetentionPolicy =>
	'retention' in room && room.retention !== undefined;

const hasCustomFields = (room: IRoom & { customFields?: any }): room is IRoom & { customFields: Record<string, unknown> } =>
	'customFields' in room && room.customFields !== undefined;

type ValidationContext = { userId: IUser['_id']; room: IRoom; value: any; rid: IRoom['_id'] };

const validators: Record<string, (context: ValidationContext) => void> = {
	default({ userId }: { userId: string }) {
		if (!hasPermission(userId, 'view-room-administration')) {
			throw new Meteor.Error('error-action-not-allowed', 'Viewing room administration is not allowed', {
				method: 'saveRoomSettings',
				action: 'Viewing_room_administration',
			});
		}
	},
	featured({ userId }: { userId: string }) {
		if (!hasPermission(userId, 'view-room-administration')) {
			throw new Meteor.Error('error-action-not-allowed', 'Viewing room administration is not allowed', {
				method: 'saveRoomSettings',
				action: 'Viewing_room_administration',
			});
		}
	},
	roomType({ userId, room, value }: { userId: string; room: IRoom; value: RoomType }) {
		if (value === room.t) {
			return;
		}

		if (value === 'c' && !hasPermission(userId, 'create-c')) {
			throw new Meteor.Error('error-action-not-allowed', 'Changing a private group to a public channel is not allowed', {
				method: 'saveRoomSettings',
				action: 'Change_Room_Type',
			});
		}

		if (value === 'p' && !hasPermission(userId, 'create-p')) {
			throw new Meteor.Error('error-action-not-allowed', 'Changing a public channel to a private room is not allowed', {
				method: 'saveRoomSettings',
				action: 'Change_Room_Type',
			});
		}
	},
	encrypted({ userId, value, room, rid }: { userId: string; value: boolean; room: IRoom; rid: IRoom['_id'] }) {
		if (value !== room.encrypted) {
			if (!roomCoordinator.getRoomDirectives(room.t)?.allowRoomSettingChange(room, RoomSettingsEnum.E2E)) {
				throw new Meteor.Error('error-action-not-allowed', 'Only groups or direct channels can enable encryption', {
					method: 'saveRoomSettings',
					action: 'Change_Room_Encrypted',
				});
			}

			if (room.t !== 'd' && !hasPermission(userId, 'toggle-room-e2e-encryption', rid)) {
				throw new Meteor.Error('error-action-not-allowed', 'You do not have permission to toggle E2E encryption', {
					method: 'saveRoomSettings',
					action: 'Change_Room_Encrypted',
				});
			}
		}
	},
	retentionEnabled({ userId, value, room, rid }: { userId: string; value: boolean; room: IRoom; rid: IRoom['_id'] }) {
		if (!hasPermission(userId, 'edit-room-retention-policy', rid) && (!hasRetentionPolicy(room) || value !== room.retention.enabled)) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	retentionMaxAge({ userId, value, room, rid }: { userId: string; value: number; room: IRoom; rid: IRoom['_id'] }) {
		if (!hasPermission(userId, 'edit-room-retention-policy', rid) && (!hasRetentionPolicy(room) || value !== room.retention.maxAge)) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	retentionExcludePinned({ userId, value, room, rid }: { userId: string; value: boolean; room: IRoom; rid: IRoom['_id'] }) {
		if (
			!hasPermission(userId, 'edit-room-retention-policy', rid) &&
			(!hasRetentionPolicy(room) || value !== room.retention.excludePinned)
		) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	retentionFilesOnly({ userId, value, room, rid }: { userId: string; value: boolean; room: IRoom; rid: IRoom['_id'] }) {
		if (!hasPermission(userId, 'edit-room-retention-policy', rid) && (!hasRetentionPolicy(room) || value !== room.retention.filesOnly)) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	retentionIgnoreThreads({ userId, value, room, rid }: { userId: string; value: boolean; room: IRoom; rid: IRoom['_id'] }) {
		if (
			!hasPermission(userId, 'edit-room-retention-policy', rid) &&
			(!hasRetentionPolicy(room) || value !== room.retention.ignoreThreads)
		) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
	roomAvatar({ userId, rid }: { userId: string; rid: IRoom['_id'] }) {
		if (!hasPermission(userId, 'edit-room-avatar', rid)) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing a room avatar is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}
	},
} as const;

type SaverContext = { value: any; room: IRoom; rid: IRoom['_id']; user: IUser };

const settingSavers: Record<string, (context: SaverContext) => Promise<void>> = {
	async roomName({ value, rid, user, room }: { value: string; rid: IRoom['_id']; user: IUser; room: IRoom }) {
		if (!(await saveRoomName(rid, value, user))) {
			return;
		}

		if (room.teamId && room.teamMain) {
			await Team.update(user._id, room.teamId, { name: value, updateRoom: false });
		}
	},
	async roomTopic({ value, room, rid, user }: { value: string; room: IRoom; rid: IRoom['_id']; user: IUser }) {
		if (!value && !room.topic) {
			return;
		}
		if (value !== room.topic) {
			saveRoomTopic(rid, value, user);
		}
	},
	async roomAnnouncement({ value, room, rid, user }: { value: string; room: IRoom; rid: IRoom['_id']; user: IUser }) {
		if (!value && !room.announcement) {
			return;
		}
		if (value !== room.announcement) {
			saveRoomAnnouncement(rid, value, user);
		}
	},
	async roomCustomFields({ value, room, rid }: { value: Record<string, string>; room: IRoom; rid: IRoom['_id'] }) {
		if (hasCustomFields(room) && value !== room.customFields) {
			saveRoomCustomFields(rid, value);
		}
	},
	async roomDescription({ value, room, rid, user }: { value: string; room: IRoom; rid: IRoom['_id']; user: IUser }) {
		if (!value && !room.description) {
			return;
		}
		if (value !== room.description) {
			saveRoomDescription(rid, value, user);
		}
	},
	async roomType({ value, room, rid, user }: { value: string; room: IRoom; rid: IRoom['_id']; user: IUser }) {
		if (value === room.t) {
			return;
		}

		if (!saveRoomType(rid, value, user)) {
			return;
		}

		if (room.teamId && room.teamMain) {
			const type = value === 'c' ? TEAM_TYPE.PUBLIC : TEAM_TYPE.PRIVATE;
			await Team.update(user._id, room.teamId, { type, updateRoom: false });
		}
	},
	async streamingOptions({ value, rid }: { value: IRoom['streamingOptions']; rid: IRoom['_id'] }) {
		saveStreamingOptions(rid, value);
	},
	async readOnly({ value, room, rid, user }: { value: boolean; room: IRoom; rid: IRoom['_id']; user: IUser }) {
		if (value !== room.ro) {
			saveRoomReadOnly(rid, value, user);
		}
	},
	async reactWhenReadOnly({ value, room, rid, user }: { value: boolean; room: IRoom; rid: IRoom['_id']; user: IUser }) {
		if (value !== room.reactWhenReadOnly) {
			saveReactWhenReadOnly(rid, value, user);
		}
	},
	async systemMessages({ value, room, rid }: { value: boolean; room: IRoom; rid: IRoom['_id']; user: IUser }) {
		if (JSON.stringify(value) !== JSON.stringify(room.sysMes)) {
			saveRoomSystemMessages(rid, value);
		}
	},
	async featured({ value, rid }: { value: boolean; rid: IRoom['_id'] }) {
		await Rooms.saveFeaturedById(rid, value);
	},
	async retentionEnabled({ value, rid }: { value: boolean; rid: IRoom['_id'] }) {
		await Rooms.saveRetentionEnabledById(rid, value);
	},
	async retentionMaxAge({ value, rid }: { value: number; rid: IRoom['_id'] }) {
		await Rooms.saveRetentionMaxAgeById(rid, value);
	},
	async retentionExcludePinned({ value, rid }: { value: boolean; rid: IRoom['_id'] }) {
		await Rooms.saveRetentionExcludePinnedById(rid, value);
	},
	async retentionFilesOnly({ value, rid }: { value: boolean; rid: IRoom['_id'] }) {
		await Rooms.saveRetentionFilesOnlyById(rid, value);
	},
	async retentionIgnoreThreads({ value, rid }: { value: boolean; rid: IRoom['_id'] }) {
		await Rooms.saveRetentionIgnoreThreadsById(rid, value);
	},
	async retentionOverrideGlobal({ value, rid }: { value: boolean; rid: IRoom['_id'] }) {
		await Rooms.saveRetentionOverrideGlobalById(rid, value);
	},
	async encrypted({ value, room, rid, user }: { value: boolean; room: IRoom; rid: IRoom['_id']; user: IUser }) {
		saveRoomEncrypted(rid, value, user, Boolean(room.encrypted) !== Boolean(value));
	},
	async favorite({ value, rid, user }: { value: { favorite: boolean }; rid: IRoom['_id']; user: IUser }) {
		const { favorite } = value;
		await saveFavoriteRoom(rid, user._id, favorite);
	},
	async roomAvatar({ value, rid, user }: { value: string; rid: IRoom['_id']; user: IUser }) {
		await setRoomAvatar(rid, value, user);
	},
} as const;

Meteor.methods({
	async saveRoomSettings(rid, settings, value) {
		const userId = Meteor.userId();

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

		let keys = Object.keys(settings);

		if (!keys.every((key) => fields.includes(key))) {
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

		if (!hasPermission(userId, 'edit-room', rid)) {
			if (!('encrypted' in settings && room.t === 'd')) {
				throw new Meteor.Error('error-action-not-allowed', 'Editing room is not allowed', {
					method: 'saveRoomSettings',
					action: 'Editing_room',
				});
			}
			settings = { encrypted: settings.encrypted };
		}

		const checkReadOnly = 'readOnly' in settings || 'reactWhenReadOnly' in settings;
		if (room.broadcast && checkReadOnly) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing readOnly/reactWhenReadOnly are not allowed for broadcast rooms', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}

		const user = Meteor.user() as IUser;

		// validations
		keys.forEach((setting) => {
			const value = settings[setting];

			const validator = validators[setting as keyof typeof validators];
			if (validator) {
				validator({
					userId,
					value,
					room,
					rid,
				});
			}

			if (setting === 'retentionOverrideGlobal') {
				delete settings.retentionMaxAge;
				delete settings.retentionExcludePinned;
				delete settings.retentionFilesOnly;
				delete settings.retentionIgnoreThreads;
			}
		});
		keys = Object.keys(settings);

		// saving data
		for await (const setting of Object.keys(settings)) {
			const value = settings[setting];

			const saver = settingSavers[setting];
			if (saver) {
				await saver({
					value,
					room,
					rid,
					user,
				});
			}
		}

		Meteor.defer(async () => {
			const room = await Rooms.findOneById(rid);
			if (room) callbacks.run('afterSaveRoomSettings', room);
		});

		return {
			result: true,
			rid: room._id,
		};
	},
});
