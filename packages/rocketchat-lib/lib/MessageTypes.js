import toastr from 'toastr';
import _ from 'underscore';

RocketChat.MessageTypes = new class {
	constructor() {
		this.types = {};
	}

	registerType(options) {
		return this.types[options.id] = options;
	}

	getType(message) {
		return this.types[message && message.t];
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
		data(message) {
			return {
				username: message.u.username
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'mentioned-users-not-in-the-room',
		system: true,
		message: 'Mentioned_users_are_not_in_the_room',
		data(message) {
			const users = message.mentionedUsers.map((username) => `<a class="mention-link" data-username=${ username }>@${ username }</a>`).join(', ');

			return {
				users
			};
		}
	});
	RocketChat.MessageTypes.registerType({
		id: 'accept-invitation-in-the-room',
		system: true,
		message: 'Accept_invitation_in_the_room',
		data(message) {
			const inviter = `@${ message.inviter }`;

			return {
				inviter
			};
		}
	});

	RocketChat.actionLinks.register('inviteUsersToRoom', function(message, params) {
		if (Meteor.isClient) {
			_.extend(params, { mid: message._id });

			Meteor.call('inviteUsersToRoom', params, function(err) {
				if (err) {
					return toastr.error(t(err.reason));
				}

				toastr.success(t('Users_invited'));
			});
		}
	});

	RocketChat.actionLinks.register('acceptInvitationToRoom', function(message, params) {
		if (Meteor.isClient) {
			Meteor.call('acceptInvitation', { message, params }, function(err) {
				if (err) {
					return toastr.error(t(err.reason));
				}
				toastr.success(t('Invitation_accepted'));
			});
		}
	});

	RocketChat.actionLinks.register('declineInvitationToRoom', function(message, params) {
		if (Meteor.isClient) {
			const { rid } = params

			if (message._id) {
				Meteor.call('deleteMessage', { _id: message._id }, function(error) {
					if (error) {
						return handleError(error);
					}
				});
			}

			Meteor.call('leaveRoom', rid, function(error) {
				if (error) {
					return handleError(error);
				}
			});
		}
	});
});
