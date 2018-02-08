RocketChat.MessageTypes = new class {
	constructor() {
		this.types = {};
	}

	registerType(options) {
		if (options.hasOwnProperty('data') && !options.hasOwnProperty('keysToReplaceInI18nByPropertiesOfMessage')) {
			throw new Meteor.Error('If you add the "data" property, you must add the "keysToReplaceInI18nByPropertiesOfMessage" in the options');
		}

		return this.types[options.id] = options;
	}

	getType(message) {
		return this.types[message && message.t];
	}

	getTypes() {
		const composeMessageTypeObject = idOfType => {
			const messageType = this.types[idOfType];
			return {
				id: messageType.id,
				message: messageType.message,
				isSystemMessage: Boolean(messageType.system),
				keysToReplaceInI18nByPropertiesOfMessage: messageType.keysToReplaceInI18nByPropertiesOfMessage || {}
			};
		};
		const filterMessageTypesThatHaveMessageProperty = () => {
			return Object.keys(this.types).filter(idOfType => Boolean(this.types[idOfType].message));
		};

		return filterMessageTypesThatHaveMessageProperty().map(composeMessageTypeObject);
	}

	isSystemMessage(message) {
		const type = this.types[message && message.t];
		return type && type.system;
	}

};

Meteor.startup(function() {
	RocketChat.MessageTypes.registerType({
		id: 'r',
		system: true,
		message: 'Room_name_changed',
		keysToReplaceInI18nByPropertiesOfMessage: {
			room_name: 'msg',
			user_by: 'u.username'
		},
		data(message) {
			return {
				room_name: message.msg,
				user_by: message.u.username
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'au',
		system: true,
		message: 'User_added_by',
		keysToReplaceInI18nByPropertiesOfMessage: {
			user_added: 'msg',
			user_by: 'u.username'
		},
		data(message) {
			return {
				user_added: message.msg,
				user_by: message.u.username
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'ru',
		system: true,
		message: 'User_removed_by',
		keysToReplaceInI18nByPropertiesOfMessage: {
			user_removed: 'msg',
			user_by: 'u.username'
		},
		data(message) {
			return {
				user_removed: message.msg,
				user_by: message.u.username
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'ul',
		system: true,
		message: 'User_left',
		keysToReplaceInI18nByPropertiesOfMessage: {
			user_left: 'u.username'
		},
		data(message) {
			return {
				user_left: message.u.username
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'uj',
		system: true,
		message: 'User_joined_channel',
		keysToReplaceInI18nByPropertiesOfMessage: {
			user: 'u.username'
		},
		data(message) {
			return {
				user: message.u.username
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'wm',
		system: true,
		message: 'Welcome',
		keysToReplaceInI18nByPropertiesOfMessage: {
			user: 'u.username'
		},
		data(message) {
			return {
				user: message.u.username
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'rm',
		system: true,
		message: 'Message_removed',
		keysToReplaceInI18nByPropertiesOfMessage: {
			user: 'u.username'
		},
		data(message) {
			return {
				user: message.u.username
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'rtc',
		render(message) {
			return RocketChat.callbacks.run('renderRtcMessage', message);
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'user-muted',
		system: true,
		message: 'User_muted_by',
		keysToReplaceInI18nByPropertiesOfMessage: {
			user_muted: 'msg',
			user_by: 'u.username'
		},
		data(message) {
			return {
				user_muted: message.msg,
				user_by: message.u.username
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'user-unmuted',
		system: true,
		message: 'User_unmuted_by',
		keysToReplaceInI18nByPropertiesOfMessage: {
			user_unmuted: 'msg',
			user_by: 'u.username'
		},
		data(message) {
			return {
				user_unmuted: message.msg,
				user_by: message.u.username
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'subscription-role-added',
		system: true,
		message: '__username__was_set__role__by__user_by_',
		keysToReplaceInI18nByPropertiesOfMessage: {
			username: 'msg',
			role: 'role',
			user_by: 'u.username'
		},
		data(message) {
			return {
				username: message.msg,
				role: message.role,
				user_by: message.u.username
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'subscription-role-removed',
		system: true,
		message: '__username__is_no_longer__role__defined_by__user_by_',
		keysToReplaceInI18nByPropertiesOfMessage: {
			username: 'msg',
			role: 'role',
			user_by: 'u.username'
		},
		data(message) {
			return {
				username: message.msg,
				role: message.role,
				user_by: message.u.username
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'room-archived',
		system: true,
		message: 'This_room_has_been_archived_by__username_',
		keysToReplaceInI18nByPropertiesOfMessage: {
			username: 'u.username'
		},
		data(message) {
			return {
				username: message.u.username
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'room-unarchived',
		system: true,
		message: 'This_room_has_been_unarchived_by__username_',
		keysToReplaceInI18nByPropertiesOfMessage: {
			username: 'u.username'
		},
		data(message) {
			return {
				username: message.u.username
			};
		}
	});
});
