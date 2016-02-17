RocketChat.callbacks.add('afterSaveMessage', function(message, room) {
	// skips this callback if the message was edited
	if (message.editedAt) {
		return message;
	}

	var user = RocketChat.models.Users.findOneById(message.u._id);

	/*
	Increment unread couter if direct messages
	 */
	var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

	var alwaysNotifyDesktopUsers, alwaysNotifyMobileUsers, desktopMentionIds, dontNotifyDesktopUsers, dontNotifyMobileUsers, i, j, len, len1, mentionIds, mobileMentionIds, ref, ref1, toAll, userIdsToNotify, userIdsToPushNotify, userOfMention, userOfMentionId, usersOfDesktopMentions, usersOfMentionId, usersOfMentionItem, usersOfMobileMentions, usersOfRoom;

	alwaysNotifyDesktopUsers = _.compact(_.map(RocketChat.models.Subscriptions.findAlwaysNotifyDesktopUsersByRoomId(room._id).fetch(), function(subscription) {
		var ref;
		return subscription != null ? (ref = subscription.u) != null ? ref._id : void 0 : void 0;
	}));

	dontNotifyDesktopUsers = _.compact(_.map(RocketChat.models.Subscriptions.findDontNotifyDesktopUsersByRoomId(room._id).fetch(), function(subscription) {
		var ref;
		return subscription != null ? (ref = subscription.u) != null ? ref._id : void 0 : void 0;
	}));

	alwaysNotifyMobileUsers = _.compact(_.map(RocketChat.models.Subscriptions.findAlwaysNotifyMobileUsersByRoomId(room._id).fetch(), function(subscription) {
		var ref;
		return subscription != null ? (ref = subscription.u) != null ? ref._id : void 0 : void 0;
	}));

	dontNotifyMobileUsers = _.compact(_.map(RocketChat.models.Subscriptions.findDontNotifyMobileUsersByRoomId(room._id).fetch(), function(subscription) {
		var ref;
		return subscription != null ? (ref = subscription.u) != null ? ref._id : void 0 : void 0;
	}));

	userIdsToNotify = [];
	userIdsToPushNotify = [];
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
		if ((userOfMention != null) && (dontNotifyDesktopUsers.indexOf(userOfMentionId) === -1 || alwaysNotifyDesktopUsers.indexOf(userOfMentionId) !== -1)) {
			RocketChat.Notifications.notifyUser(userOfMention._id, 'notification', {
				title: "@" + user.username,
				text: message.msg,
				payload: {
					rid: message.rid,
					sender: message.u,
					type: room.t,
					name: room.name
				}
			});
		}
		if ((userOfMention != null) && (dontNotifyMobileUsers.indexOf(userOfMentionId) === -1 || alwaysNotifyMobileUsers.indexOf(userOfMentionId) !== -1)) {
			if (Push.enabled === true && userOfMention.statusConnection !== 'online') {
				Push.send({
					from: 'push',
					title: "@" + user.username,
					text: message.msg,
					apn: {
						text: "@" + user.username + ":\n" + message.msg
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
		if (mentionIds.length > 0 || alwaysNotifyDesktopUsers.length > 0) {
			desktopMentionIds = _.union(mentionIds, alwaysNotifyDesktopUsers);
			desktopMentionIds = _.difference(desktopMentionIds, dontNotifyDesktopUsers);
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
				for (i = 0, len = usersOfDesktopMentions.length; i < len; i++) {
					usersOfMentionItem = usersOfDesktopMentions[i];
					if (room.usernames.indexOf(usersOfMentionItem.username) === -1) {
						Meteor.runAsUser(usersOfMentionItem._id, function() {
							return Meteor.call('joinRoom', room._id);
						});
					}
				}
			}
			userIdsToNotify = _.pluck(usersOfDesktopMentions, '_id');
		}

		if (mentionIds.length > 0 || alwaysNotifyMobileUsers.length > 0) {
			mobileMentionIds = _.union(mentionIds, alwaysNotifyMobileUsers);
			mobileMentionIds = _.difference(mobileMentionIds, dontNotifyMobileUsers);
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
			userIdsToPushNotify = _.pluck(_.filter(usersOfMobileMentions, function(user) {
				return user.statusConnection !== 'online';
			}), '_id');
		}

		if (toAll && ((ref1 = room.usernames) != null ? ref1.length : void 0) > 0) {
			usersOfRoom = RocketChat.models.Users.find({
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
				if (((ref2 = user.status) === 'online' || ref2 === 'away' || ref2 === 'busy') && (ref3 = user._id, indexOf.call(dontNotifyDesktopUsers, ref3) < 0)) {
					userIdsToNotify.push(user._id);
				}
				if (user.statusConnection !== 'online' && (ref4 = user._id, indexOf.call(dontNotifyMobileUsers, ref4) < 0)) {
					return userIdsToPushNotify.push(user._id);
				}
			});
			userIdsToNotify = _.unique(userIdsToNotify);
			userIdsToPushNotify = _.unique(userIdsToPushNotify);
		}

		if (userIdsToNotify.length > 0) {
			for (j = 0, len1 = userIdsToNotify.length; j < len1; j++) {
				usersOfMentionId = userIdsToNotify[j];
				RocketChat.Notifications.notifyUser(usersOfMentionId, 'notification', {
					title: "@" + user.username + " @ #" + room.name,
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
					title: "@" + user.username + " @ #" + room.name,
					text: message.msg,
					apn: {
						text: "@" + user.username + " @ #" + room.name + ":\n" + message.msg
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

		if (mentionIds > 0) {
			/*
			Update all other subscriptions of mentioned users to alert their owners and incrementing
			the unread counter for mentions and direct messages
			 */
			if (toAll) {
				RocketChat.models.Subscriptions.incUnreadForRoomIdExcludingUserId(message.rid, user._id, 1);
			} else {
				RocketChat.models.Subscriptions.incUnreadForRoomIdAndUserIds(message.rid, mentionIds, 1);
			}
		}
	}

	return message;

}, RocketChat.callbacks.priority.LOW);
