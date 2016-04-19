/* globals Push */

RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	var user = RocketChat.models.Users.findOneById(message.u._id);

	/*
	Increment unread couter if direct messages
	 */
	var indexOf = [].indexOf || function(item) {
		for (var i = 0, l = this.length; i < l; i++) {
			if (i in this && this[i] === item) {
				return i;
			}
		}
		return -1;
	};

	var settings, desktopMentionIds, i, j, len, len1, highlights, mentionIds, highlightsIds, usersWithHighlights, mobileMentionIds, ref, ref1, toAll, userIdsToNotify, userIdsToPushNotify, userOfMention, userOfMentionId, usersOfDesktopMentions, usersOfMentionId, usersOfMentionItem, usersOfMobileMentions;

	/**
	 * Checks if a given user can be notified
	 *
	 * @param {string} id
	 * @param {string} type - mobile|desktop
	 *
	 * @returns {boolean}
     */
	function canBeNotified(id, type) {
		var types = {
			mobile: [ 'dontNotifyDesktopUsers', 'alwaysNotifyDesktopUsers' ],
			desktop: [ 'dontNotifyMobileUsers', 'alwaysNotifyMobileUsers' ]
		};

		return (settings[types[type][0]].indexOf(id) === -1 || settings[types[type][1]].indexOf(id) !== -1);
	}

	/**
	 * Chechs if a messages contains a user highlight
	 *
	 * @param {string} message
	 * @param {array|undefined} highlights
	 *
	 * @returns {boolean}
	 */
	function messageContainsHighlight(message, highlights) {
		if (! highlights || highlights.length === 0) { return false; }

		var has = false;
		highlights.some(function (highlight) {
			var regexp = new RegExp(s.escapeRegExp(highlight),'i');
			if (regexp.test(message.msg)) {
				has = true;
				return true;
			}
		});

		return has;
	}

	settings = {};

	settings.alwaysNotifyDesktopUsers = [];
	settings.dontNotifyDesktopUsers = [];
	settings.alwaysNotifyMobileUsers = [];
	settings.dontNotifyMobileUsers = [];
	RocketChat.models.Subscriptions.findNotificationPreferencesByRoom(room._id).forEach(function(subscription) {
		if (subscription.desktopNotifications === 'all') {
			settings.alwaysNotifyDesktopUsers.push(subscription.u._id);
		} else if (subscription.desktopNotifications === 'nothing') {
			settings.dontNotifyDesktopUsers.push(subscription.u._id);
		} else if (subscription.mobilePushNotifications === 'all') {
			settings.alwaysNotifyMobileUsers.push(subscription.u._id);
		} else if (subscription.mobilePushNotifications === 'nothing') {
			settings.dontNotifyMobileUsers.push(subscription.u._id);
		}
	});

	userIdsToNotify = [];
	userIdsToPushNotify = [];
	usersWithHighlights = [];
	highlights = RocketChat.models.Users.findUsersByUsernamesWithHighlights(room.usernames, { fields: { '_id': 1, 'settings.preferences.highlights': 1 }}).fetch();

	highlights.forEach(function (user) {
		if (user && user.settings && user.settings.preferences && messageContainsHighlight(message, user.settings.preferences.highlights)) {
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
		push_username = '@' + user.username;
		push_room = '#' + room.name + ' ';
	} else {
		push_username = ' ';
		push_room = ' ';
	}

	if ((room.t == null) || room.t === 'd') {
		userOfMentionId = message.rid.replace(message.u._id, '');
		userOfMention = RocketChat.models.Users.findOne({
			_id: userOfMentionId
		}, {
			fields: {
				username: 1,
				statusConnection: 1
			}
		});
		if ((userOfMention != null) && canBeNotified(userOfMentionId, 'mobile')) {
			RocketChat.Notifications.notifyUser(userOfMention._id, 'notification', {
				title: '@' + user.username,
				text: message.msg,
				payload: {
					rid: message.rid,
					sender: message.u,
					type: room.t,
					name: room.name
				}
			});
		}
		if ((userOfMention != null) && canBeNotified(userOfMentionId, 'desktop')) {
			if (Push.enabled === true && userOfMention.statusConnection !== 'online') {
				Push.send({
					from: 'push',
					title: push_username,
					text: push_message,
					apn: {
						// ternary operator
						text: push_username + ((push_username !== ' ' && push_message !== ' ') ? ':\n' : '') + push_message
					},
					badge: 1,
					sound: 'chime',
					payload: {
						host: Meteor.absoluteUrl(),
						rid: message.rid,
						sender: message.u,
						type: room.t,
						name: room.name
					},
					query: {
						userId: userOfMention._id
					}
				});
				return message;
			}
		}
	} else {
		mentionIds = [];
		if ((ref = message.mentions) != null) {
			ref.forEach(function(mention) {
				return mentionIds.push(mention._id);
			});
		}
		toAll = mentionIds.indexOf('all') > -1;
		if (mentionIds.length > 0 || settings.alwaysNotifyDesktopUsers.length > 0) {
			desktopMentionIds = _.union(mentionIds, settings.alwaysNotifyDesktopUsers);
			desktopMentionIds = _.difference(desktopMentionIds, settings.dontNotifyDesktopUsers);

			usersOfDesktopMentions = RocketChat.models.Users.find({
				_id: {
					$in: desktopMentionIds
				}
			}, {
				fields: {
					_id: 1,
					username: 1
				}
			}).fetch();
			if (room.t === 'c' && !toAll) {
				const callJoin = function(usersOfMentionItem) {
					Meteor.runAsUser(usersOfMentionItem._id, function() {
						return Meteor.call('joinRoom', room._id);
					});
				};
				for (i = 0, len = usersOfDesktopMentions.length; i < len; i++) {
					usersOfMentionItem = usersOfDesktopMentions[i];
					if (room.usernames.indexOf(usersOfMentionItem.username) === -1) {
						callJoin(usersOfMentionItem);
					}
				}
			}

			if (room.t !== 'c') {
				usersOfDesktopMentions.forEach(function(usersOfMentionItem, indexOfUser) {
					if (room.usernames.indexOf(usersOfMentionItem.username) === -1) {
						usersOfDesktopMentions.splice(indexOfUser, 1);
					}
				});
			}

			userIdsToNotify = _.pluck(usersOfDesktopMentions, '_id');
		}

		if (mentionIds.length > 0 || settings.alwaysNotifyMobileUsers.length > 0) {
			mobileMentionIds = _.union(mentionIds, settings.alwaysNotifyMobileUsers);
			mobileMentionIds = _.difference(mobileMentionIds, settings.dontNotifyMobileUsers);

			usersOfMobileMentions = RocketChat.models.Users.find({
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
				usersOfMobileMentions.forEach(function(usersOfMentionItem, indexOfUser) {
					if (room.usernames.indexOf(usersOfMentionItem.username) === -1) {
						usersOfMobileMentions.splice(indexOfUser, 1);
					}
				});
			}

			userIdsToPushNotify = _.pluck(_.filter(usersOfMobileMentions, function(user) {
				return user.statusConnection !== 'online';
			}), '_id');
		}

		if (toAll && ((ref1 = room.usernames) != null ? ref1.length : void 0) > 0) {
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
				var ref2, ref3, ref4;
				if (((ref2 = user.status) === 'online' || ref2 === 'away' || ref2 === 'busy') && (ref3 = user._id, indexOf.call(settings.dontNotifyDesktopUsers, ref3) < 0)) {
					userIdsToNotify.push(user._id);
				}
				if (user.statusConnection !== 'online' && (ref4 = user._id, indexOf.call(settings.dontNotifyMobileUsers, ref4) < 0)) {
					return userIdsToPushNotify.push(user._id);
				}
			});
		}

		if (usersWithHighlights.length > 0) {
			highlightsIds = _.pluck(usersWithHighlights, '_id');
			userIdsToNotify = userIdsToNotify.concat(highlightsIds);
			userIdsToPushNotify = userIdsToPushNotify.concat(highlightsIds);
		}

		userIdsToNotify = _.compact(_.unique(userIdsToNotify));
		userIdsToPushNotify = _.compact(_.unique(userIdsToPushNotify));

		if (userIdsToNotify.length > 0) {
			for (j = 0, len1 = userIdsToNotify.length; j < len1; j++) {
				usersOfMentionId = userIdsToNotify[j];
				RocketChat.Notifications.notifyUser(usersOfMentionId, 'notification', {
					title: '@' + user.username + ' @ #' + room.name,
					text: message.msg,
					payload: {
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
				Push.send({
					from: 'push',
					title: push_room + push_username,
					text: push_message,
					apn: {
						// ternary operator
						text: push_room + push_username + ((push_username !== ' ' && push_room !== ' ' && push_message !== ' ') ? ':\n' : '') + push_message
					},
					badge: 1,
					sound: 'chime',
					payload: {
						host: Meteor.absoluteUrl(),
						rid: message.rid,
						sender: message.u,
						type: room.t,
						name: room.name
					},
					query: {
						userId: {
							$in: userIdsToPushNotify
						}
					}
				});
			}
		}
	}

	return message;

}, RocketChat.callbacks.priority.LOW);
