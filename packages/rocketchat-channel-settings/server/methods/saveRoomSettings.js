import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';

const fields = ['roomName', 'roomTopic', 'roomAnnouncement', 'roomCustomFields', 'roomDescription', 'roomType', 'readOnly', 'reactWhenReadOnly', 'systemMessages', 'default', 'joinCode', 'tokenpass', 'streamingOptions', 'retentionEnabled', 'retentionMaxAge', 'retentionExcludePinned', 'retentionFilesOnly', 'retentionOverrideGlobal', 'encrypted'];
Meteor.methods({
	saveRoomSettings(rid, settings, value) {
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
				[settings] : value,
			};
		}

		if (!Object.keys(settings).every((key) => fields.includes(key))) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings provided', {
				method: 'saveRoomSettings',
			});
		}

		if (!RocketChat.authz.hasPermission(userId, 'edit-room', rid)) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}

		const room = RocketChat.models.Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'saveRoomSettings',
			});
		}

		if (room.broadcast && (settings.readOnly || settings.reactWhenReadOnly)) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing readOnly/reactWhenReadOnly are not allowed for broadcast rooms', {
				method: 'saveRoomSettings',
				action: 'Editing_room',
			});
		}

		const user = Meteor.user();

		// validations

		Object.keys(settings).forEach((setting) => {
			const value = settings[setting];
			if (settings === 'default' && !RocketChat.authz.hasPermission(userId, 'view-room-administration')) {
				throw new Meteor.Error('error-action-not-allowed', 'Viewing room administration is not allowed', {
					method: 'saveRoomSettings',
					action: 'Viewing_room_administration',
				});
			}
			if (setting === 'roomType' && value !== room.t && value === 'c' && !RocketChat.authz.hasPermission(userId, 'create-c')) {
				throw new Meteor.Error('error-action-not-allowed', 'Changing a private group to a public channel is not allowed', {
					method: 'saveRoomSettings',
					action: 'Change_Room_Type',
				});
			}
			if (setting === 'roomType' && value !== room.t && value === 'p' && !RocketChat.authz.hasPermission(userId, 'create-p')) {
				throw new Meteor.Error('error-action-not-allowed', 'Changing a public channel to a private room is not allowed', {
					method: 'saveRoomSettings',
					action: 'Change_Room_Type',
				});
			}
			if (setting === 'encrypted' && value !== room.encrypted && (room.t !== 'd' && room.t !== 'p')) {
				throw new Meteor.Error('error-action-not-allowed', 'Only groups or direct channels can enable encryption', {
					method: 'saveRoomSettings',
					action: 'Change_Room_Encrypted',
				});
			}

			if (setting === 'retentionEnabled' && !RocketChat.authz.hasPermission(userId, 'edit-room-retention-policy', rid) && value !== room.retention.enabled) {
				throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
					method: 'saveRoomSettings',
					action: 'Editing_room',
				});
			}
			if (setting === 'retentionMaxAge' && !RocketChat.authz.hasPermission(userId, 'edit-room-retention-policy', rid) && value !== room.retention.maxAge) {
				throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
					method: 'saveRoomSettings',
					action: 'Editing_room',
				});
			}
			if (setting === 'retentionExcludePinned' && !RocketChat.authz.hasPermission(userId, 'edit-room-retention-policy', rid) && value !== room.retention.excludePinned) {
				throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
					method: 'saveRoomSettings',
					action: 'Editing_room',
				});
			}
			if (setting === 'retentionFilesOnly' && !RocketChat.authz.hasPermission(userId, 'edit-room-retention-policy', rid) && value !== room.retention.filesOnly) {
				throw new Meteor.Error('error-action-not-allowed', 'Editing room retention policy is not allowed', {
					method: 'saveRoomSettings',
					action: 'Editing_room',
				});
			}
			if (setting === 'retentionOverrideGlobal') {
				delete settings.retentionMaxAge;
				delete settings.retentionExcludePinned;
				delete settings.retentionFilesOnly;
			}
		});

		Object.keys(settings).forEach((setting) => {
			const value = settings[setting];
			switch (setting) {
				case 'roomName':
					RocketChat.saveRoomName(rid, value, user);
					break;
				case 'roomTopic':
					if (value !== room.topic) {
						RocketChat.saveRoomTopic(rid, value, user);
					}
					break;
				case 'roomAnnouncement':
					if (value !== room.announcement) {
						RocketChat.saveRoomAnnouncement(rid, value, user);
					}
					break;
				case 'roomCustomFields':
					if (value !== room.customFields) {
						RocketChat.saveRoomCustomFields(rid, value);
					}
					break;
				case 'roomDescription':
					if (value !== room.description) {
						RocketChat.saveRoomDescription(rid, value, user);
					}
					break;
				case 'roomType':
					if (value !== room.t) {
						RocketChat.saveRoomType(rid, value, user);
					}
					break;
				case 'tokenpass':
					check(value, {
						require: String,
						tokens: [{
							token: String,
							balance: String,
						}],
					});
					RocketChat.saveRoomTokenpass(rid, value);
					break;
				case 'streamingOptions':
					RocketChat.saveStreamingOptions(rid, value);
					break;
				case 'readOnly':
					if (value !== room.ro) {
						RocketChat.saveRoomReadOnly(rid, value, user);
					}
					break;
				case 'reactWhenReadOnly':
					if (value !== room.reactWhenReadOnly) {
						RocketChat.saveReactWhenReadOnly(rid, value, user);
					}
					break;
				case 'systemMessages':
					if (value !== room.sysMes) {
						RocketChat.saveRoomSystemMessages(rid, value, user);
					}
					break;
				case 'joinCode':
					RocketChat.models.Rooms.setJoinCodeById(rid, String(value));
					break;
				case 'default':
					RocketChat.models.Rooms.saveDefaultById(rid, value);
					break;
				case 'retentionEnabled':
					RocketChat.models.Rooms.saveRetentionEnabledById(rid, value);
					break;
				case 'retentionMaxAge':
					RocketChat.models.Rooms.saveRetentionMaxAgeById(rid, value);
					break;
				case 'retentionExcludePinned':
					RocketChat.models.Rooms.saveRetentionExcludePinnedById(rid, value);
					break;
				case 'retentionFilesOnly':
					RocketChat.models.Rooms.saveRetentionFilesOnlyById(rid, value);
					break;
				case 'retentionOverrideGlobal':
					RocketChat.models.Rooms.saveRetentionOverrideGlobalById(rid, value);
					break;
				case 'encrypted':
					RocketChat.models.Rooms.saveEncryptedById(rid, value);
					break;
			}
		});

		Meteor.defer(function() {
			const room = RocketChat.models.Rooms.findOneById(rid);
			RocketChat.callbacks.run('afterSaveRoomSettings', room);
		});

		return {
			result: true,
			rid: room._id,
		};
	},
});
