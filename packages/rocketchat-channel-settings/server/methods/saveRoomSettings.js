const fields = ['roomName', 'roomTopic', 'roomAnnouncement', 'roomDescription', 'roomType', 'readOnly', 'reactWhenReadOnly', 'systemMessages', 'default', 'joinCode', 'tokenpass', 'streamingOptions'];
Meteor.methods({
	saveRoomSettings(rid, settings, value) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				'function': 'RocketChat.saveRoomName'
			});
		}
		if (!Match.test(rid, String)) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'saveRoomSettings'
			});
		}

		if (typeof settings !== 'object') {
			settings = {
				[settings] : value
			};
		}

		if (!Object.keys(settings).every(key => fields.includes(key))) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings provided', {
				method: 'saveRoomSettings'
			});
		}

		if (!RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', rid)) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing room is not allowed', {
				method: 'saveRoomSettings',
				action: 'Editing_room'
			});
		}

		const room = RocketChat.models.Rooms.findOneById(rid);

		if (room.broadcast && (settings.readOnly || settings.reactWhenReadOnly)) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing readOnly/reactWhenReadOnly are not allowed for broadcast rooms', {
				method: 'saveRoomSettings',
				action: 'Editing_room'
			});
		}

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'saveRoomSettings'
			});
		}

		const user = Meteor.user();

		Object.keys(settings).forEach(setting => {
			const value = settings[setting];
			if (settings === 'default' && !RocketChat.authz.hasPermission(this.userId, 'view-room-administration')) {
				throw new Meteor.Error('error-action-not-allowed', 'Viewing room administration is not allowed', {
					method: 'saveRoomSettings',
					action: 'Viewing_room_administration'
				});
			}
			if (setting === 'roomType' && value !== room.t && value === 'c' && !RocketChat.authz.hasPermission(this.userId, 'create-c')) {
				throw new Meteor.Error('error-action-not-allowed', 'Changing a private group to a public channel is not allowed', {
					method: 'saveRoomSettings',
					action: 'Change_Room_Type'
				});
			}
			if (setting === 'roomType' && value !== room.t && value === 'p' && !RocketChat.authz.hasPermission(this.userId, 'create-p')) {
				throw new Meteor.Error('error-action-not-allowed', 'Changing a public channel to a private room is not allowed', {
					method: 'saveRoomSettings',
					action: 'Change_Room_Type'
				});
			}
		});

		Object.keys(settings).forEach(setting => {
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
							balance: String
						}]
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
			}
		});

		return {
			result: true,
			rid: room._id
		};
	}
});
