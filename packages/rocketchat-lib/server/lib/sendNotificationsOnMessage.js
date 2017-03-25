/* globals Push */
import moment from 'moment';

RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	if (message.ts && Math.abs(moment(message.ts).diff()) > 60000) {
		return message;
	}

	const user = RocketChat.models.Users.findOneById(message.u._id);

	/*
	Increment unread couter if direct messages
	 */
	const settings = {};

	/**
	 * Checks if a given user can be notified
	 *
	 * @param {string} id
	 * @param {string} type - mobile|desktop
	 *
	 * @returns {boolean}
     */
	function canBeNotified(id, type) {
		const types = {
			mobile: [ 'dontNotifyDesktopUsers', 'alwaysNotifyDesktopUsers' ],
			desktop: [ 'dontNotifyMobileUsers', 'alwaysNotifyMobileUsers' ]
		};

		return (settings[types[type][0]].indexOf(id) === -1 || settings[types[type][1]].indexOf(id) !== -1);
	}

	/**
	 * Checks if a message contains a user highlight
	 *
	 * @param {string} message
	 * @param {array|undefined} highlights
	 *
	 * @returns {boolean}
	 */
	function messageContainsHighlight(message, highlights) {
		if (! highlights || highlights.length === 0) { return false; }

		let has = false;
		highlights.some(function(highlight) {
			const regexp = new RegExp(s.escapeRegExp(highlight), 'i');
			if (regexp.test(message.msg)) {
				has = true;
				return true;
			}
		});

		return has;
	}

	settings.alwaysNotifyDesktopUsers = [];
	settings.dontNotifyDesktopUsers = [];
	settings.alwaysNotifyMobileUsers = [];
	settings.dontNotifyMobileUsers = [];
	settings.desktopNotificationDurations = {};

	const notificationPreferencesByRoom = RocketChat.models.Subscriptions.findNotificationPreferencesByRoom(room._id);
	notificationPreferencesByRoom.forEach(function(subscription) {
		if (subscription.desktopNotifications === 'all') {
			settings.alwaysNotifyDesktopUsers.push(subscription.u._id);
		} else if (subscription.desktopNotifications === 'nothing') {
			settings.dontNotifyDesktopUsers.push(subscription.u._id);
		}
		if (subscription.mobilePushNotifications === 'all') {
			settings.alwaysNotifyMobileUsers.push(subscription.u._id);
		} else if (subscription.mobilePushNotifications === 'nothing') {
			settings.dontNotifyMobileUsers.push(subscription.u._id);
		}
		settings.desktopNotificationDurations[subscription.u._id] = subscription.desktopNotificationDuration;
	});

	let userIdsToNotify = [];
	let userIdsToPushNotify = [];
	const usersWithHighlights = [];

	const highlights = RocketChat.models.Users.findUsersByUsernamesWithHighlights(room.usernames, { fields: { '_id': 1, 'settings.preferences.highlights': 1 }}).fetch();

	highlights.forEach(function(user) {
		if (messageContainsHighlight(message, user.settings.preferences.highlights)) {
			usersWithHighlights.push(user);
		}
	});

	let push_message;
	//Set variables depending on Push Notification settings
	if (RocketChat.settings.get('Push_show_message')) {
		push_message = message.msg;
	} else {
		push_message = ' ';
	}

	let push_username;
	let push_room;
	if (RocketChat.settings.get('Push_show_username_room')) {
		push_username = user.username;
		push_room = `#${ room.name }`;
	} else {
		push_username = '';
		push_room = '';
	}

	if (room.t == null || room.t === 'd') {
		const userOfMentionId = message.rid.replace(message.u._id, '');
		const userOfMention = RocketChat.models.Users.findOne({
			_id: userOfMentionId
		}, {
			fields: {
				username: 1,
				statusConnection: 1
			}
		});

		// Always notify Sandstorm
		if (userOfMention != null) {
			RocketChat.Sandstorm.notify(message, [userOfMention._id],
				`@${ user.username }: ${ message.msg }`, 'privateMessage');

		}
		if ((userOfMention != null) && canBeNotified(userOfMentionId, 'mobile')) {
			RocketChat.Notifications.notifyUser(userOfMention._id, 'notification', {
				title: `@${ user.username }`,
				text: message.msg,
				duration: settings.desktopNotificationDurations[userOfMention._id],
				payload: {
					_id: message._id,
					rid: message.rid,
					sender: message.u,
					type: room.t,
					name: room.name
				}
			});
		}

		if ((userOfMention != null) && canBeNotified(userOfMentionId, 'desktop')) {
			if (Push.enabled === true && userOfMention.statusConnection !== 'online') {
				RocketChat.PushNotification.send({
					roomId: message.rid,
					username: push_username,
					message: push_message,
					payload: {
						host: Meteor.absoluteUrl(),
						rid: message.rid,
						sender: message.u,
						type: room.t,
						name: room.name
					},
					usersTo: {
						userId: userOfMention._id
					}
				});
				return message;
			}
		}

	} else {
		const mentionIds = [];
		if (message.mentions != null) {
			message.mentions.forEach(function(mention) {
				return mentionIds.push(mention._id);
			});
		}
		const toAll = mentionIds.indexOf('all') > -1;
		const toHere = mentionIds.indexOf('here') > -1;
		if (mentionIds.length > 0 || settings.alwaysNotifyDesktopUsers.length > 0) {
			let desktopMentionIds = _.union(mentionIds, settings.alwaysNotifyDesktopUsers);
			desktopMentionIds = _.difference(desktopMentionIds, settings.dontNotifyDesktopUsers);

			let usersOfDesktopMentions = RocketChat.models.Users.find({
				_id: {
					$in: desktopMentionIds
				}
			}, {
				fields: {
					_id: 1,
					username: 1,
					active: 1
				}
			}).fetch();
			if (room.t === 'c' && !toAll) {
				const callJoin = function(usersOfMentionItem) {
					if (usersOfMentionItem.active) {
						Meteor.runAsUser(usersOfMentionItem._id, function() {
							return Meteor.call('joinRoom', room._id);
						});
					}
				};
				for (const usersOfMentionItem of usersOfDesktopMentions) {
					if (room.usernames.indexOf(usersOfMentionItem.username) === -1) {
						callJoin(usersOfMentionItem);
					}
				}
			}

			if (room.t !== 'c') {
				usersOfDesktopMentions = _.reject(usersOfDesktopMentions, (usersOfMentionItem) => {
					return room.usernames.indexOf(usersOfMentionItem.username) === -1;
				});
			}

			userIdsToNotify = _.pluck(usersOfDesktopMentions, '_id');
		}

		if (mentionIds.length > 0 || settings.alwaysNotifyMobileUsers.length > 0) {
			let mobileMentionIds = _.union(mentionIds, settings.alwaysNotifyMobileUsers);
			mobileMentionIds = _.difference(mobileMentionIds, settings.dontNotifyMobileUsers);

			let usersOfMobileMentions = RocketChat.models.Users.find({
				_id: {
					$in: mobileMentionIds
				}
			}, {
				fields: {
					_id: 1,
					username: 1,
					statusConnection: 1
				}
			}).fetch();

			if (room.t !== 'c') {
				usersOfMobileMentions = _.reject(usersOfMobileMentions, (usersOfMentionItem) => {
					return room.usernames.indexOf(usersOfMentionItem.username) === -1;
				});
			}

			userIdsToPushNotify = _.pluck(_.filter(usersOfMobileMentions, function(user) {
				return user.statusConnection !== 'online';
			}), '_id');
		}

		if ((toAll || toHere) && room.usernames && room.usernames.length > 0) {
			RocketChat.models.Users.find({
				username: {
					$in: room.usernames
				},
				_id: {
					$ne: user._id
				}
			}, {
				fields: {
					_id: 1,
					username: 1,
					status: 1,
					statusConnection: 1
				}
			}).forEach(function(user) {
				if (['online', 'away', 'busy'].includes(user.status) && (settings.dontNotifyDesktopUsers || []).includes(user._id) === false) {
					userIdsToNotify.push(user._id);
				}
				if (toAll && user.statusConnection !== 'online' && (settings.dontNotifyMobileUsers || []).includes(user._id) === false) {
					return userIdsToPushNotify.push(user._id);
				}
			});
		}

		if (usersWithHighlights.length > 0) {
			const highlightsIds = _.pluck(usersWithHighlights, '_id');
			userIdsToNotify = userIdsToNotify.concat(highlightsIds);
			userIdsToPushNotify = userIdsToPushNotify.concat(highlightsIds);
		}

		userIdsToNotify = _.without(_.compact(_.unique(userIdsToNotify)), message.u._id);
		userIdsToPushNotify = _.without(_.compact(_.unique(userIdsToPushNotify)), message.u._id);

		if (userIdsToNotify.length > 0) {
			for (const usersOfMentionId of userIdsToNotify) {
				let title = `@${ user.username }`;
				if (room.name) {
					title += ` @ #${ room.name }`;
				}
				RocketChat.Notifications.notifyUser(usersOfMentionId, 'notification', {
					title,
					text: message.msg,
					duration: settings.desktopNotificationDurations[usersOfMentionId],
					payload: {
						_id: message._id,
						rid: message.rid,
						sender: message.u,
						type: room.t,
						name: room.name
					}
				});
			}
		}

		if (userIdsToPushNotify.length > 0) {
			if (Push.enabled === true) {
				RocketChat.PushNotification.send({
					roomId: message.rid,
					roomName: push_room,
					username: push_username,
					message: push_message,
					payload: {
						host: Meteor.absoluteUrl(),
						rid: message.rid,
						sender: message.u,
						type: room.t,
						name: room.name
					},
					usersTo: {
						userId: {
							$in: userIdsToPushNotify
						}
					}
				});
			}
		}

		const allUserIdsToNotify = _.unique(userIdsToNotify.concat(userIdsToPushNotify));
		if (room.t === 'p') {
			RocketChat.Sandstorm.notify(message, allUserIdsToNotify,
				`@${ user.username }: ${ message.msg }`, 'privateMessage');
		} else {
			RocketChat.Sandstorm.notify(message, allUserIdsToNotify,
				`@${ user.username }: ${ message.msg }`, 'message');
		}
	}

	return message;

}, RocketChat.callbacks.priority.LOW, 'sendNotificationOnMessage');
