import { Meteor } from 'meteor/meteor';
import { Match } from 'meteor/check';
import _ from 'underscore';

import { Base } from './_Base';
import Rooms from './Rooms';
import Users from './Users';
import { getDefaultSubscriptionPref } from '../../../utils/lib/getDefaultSubscriptionPref';

export class Subscriptions extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ rid: 1, 'u._id': 1 }, { unique: 1 });
		this.tryEnsureIndex({ rid: 1, 'u.username': 1 });
		this.tryEnsureIndex({ rid: 1, alert: 1, 'u._id': 1 });
		this.tryEnsureIndex({ rid: 1, roles: 1 });
		this.tryEnsureIndex({ 'u._id': 1, name: 1, t: 1 });
		this.tryEnsureIndex({ open: 1 });
		this.tryEnsureIndex({ alert: 1 });

		this.tryEnsureIndex({ rid: 1, 'u._id': 1, open: 1 });

		this.tryEnsureIndex({ ts: 1 });
		this.tryEnsureIndex({ ls: 1 });
		this.tryEnsureIndex({ audioNotifications: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ desktopNotifications: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ mobilePushNotifications: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ emailNotifications: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ autoTranslate: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ autoTranslateLanguage: 1 }, { sparse: 1 });
		this.tryEnsureIndex({ 'userHighlights.0': 1 }, { sparse: 1 });
		this.tryEnsureIndex({ prid: 1 });
	}

	findByRoomIds(roomIds) {
		const query = {
			rid: {
				$in: roomIds,
			},
		};
		const options = {
			fields: {
				'u._id': 1,
				rid: 1,
			},
		};

		return this._db.find(query, options);
	}

	removeByVisitorToken(token) {
		const query = {
			'v.token': token,
		};

		this.remove(query);
	}

	updateAutoTranslateById(_id, autoTranslate) {
		const query = {
			_id,
		};

		let update;
		if (autoTranslate) {
			update = {
				$set: {
					autoTranslate,
				},
			};
		} else {
			update = {
				$unset: {
					autoTranslate: 1,
				},
			};
		}

		return this.update(query, update);
	}

	updateAutoTranslateLanguageById(_id, autoTranslateLanguage) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				autoTranslateLanguage,
			},
		};

		return this.update(query, update);
	}

	getAutoTranslateLanguagesByRoomAndNotUser(rid, userId) {
		const subscriptionsRaw = this.model.rawCollection();
		const distinct = Meteor.wrapAsync(subscriptionsRaw.distinct, subscriptionsRaw);
		const query = {
			rid,
			'u._id': { $ne: userId },
			autoTranslate: true,
		};
		return distinct('autoTranslateLanguage', query);
	}

	roleBaseQuery(userId, scope) {
		if (scope == null) {
			return;
		}

		const query = { 'u._id': userId };
		if (!_.isUndefined(scope)) {
			query.rid = scope;
		}
		return query;
	}

	findByRidWithoutE2EKey(rid, options) {
		const query = {
			rid,
			E2EKey: {
				$exists: false,
			},
		};

		return this.find(query, options);
	}

	updateAudioNotificationsById(_id, audioNotifications) {
		const query = {
			_id,
		};

		const update = {};

		if (audioNotifications === 'default') {
			update.$unset = { audioNotifications: 1 };
		} else {
			update.$set = { audioNotifications };
		}

		return this.update(query, update);
	}

	updateAudioNotificationValueById(_id, audioNotificationValue) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				audioNotificationValue,
			},
		};

		return this.update(query, update);
	}

	updateDesktopNotificationsById(_id, desktopNotifications) {
		const query = {
			_id,
		};

		const update = {};

		if (desktopNotifications === null) {
			update.$unset = {
				desktopNotifications: 1,
				desktopPrefOrigin: 1,
			};
		} else {
			update.$set = {
				desktopNotifications: desktopNotifications.value,
				desktopPrefOrigin: desktopNotifications.origin,
			};
		}

		return this.update(query, update);
	}

	updateDesktopNotificationDurationById(_id, value) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				desktopNotificationDuration: parseInt(value),
			},
		};

		return this.update(query, update);
	}

	updateMobilePushNotificationsById(_id, mobilePushNotifications) {
		const query = {
			_id,
		};

		const update = {};

		if (mobilePushNotifications === null) {
			update.$unset = {
				mobilePushNotifications: 1,
				mobilePrefOrigin: 1,
			};
		} else {
			update.$set = {
				mobilePushNotifications: mobilePushNotifications.value,
				mobilePrefOrigin: mobilePushNotifications.origin,
			};
		}

		return this.update(query, update);
	}

	updateEmailNotificationsById(_id, emailNotifications) {
		const query = {
			_id,
		};

		const update = {};

		if (emailNotifications === null) {
			update.$unset = {
				emailNotifications: 1,
				emailPrefOrigin: 1,
			};
		} else {
			update.$set = {
				emailNotifications: emailNotifications.value,
				emailPrefOrigin: emailNotifications.origin,
			};
		}

		return this.update(query, update);
	}

	updateUnreadAlertById(_id, unreadAlert) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				unreadAlert,
			},
		};

		return this.update(query, update);
	}

	updateDisableNotificationsById(_id, disableNotifications) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				disableNotifications,
			},
		};

		return this.update(query, update);
	}

	updateHideUnreadStatusById(_id, hideUnreadStatus) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				hideUnreadStatus,
			},
		};

		return this.update(query, update);
	}

	updateMuteGroupMentions(_id, muteGroupMentions) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				muteGroupMentions,
			},
		};

		return this.update(query, update);
	}

	findAlwaysNotifyAudioUsersByRoomId(roomId) {
		const query = {
			rid: roomId,
			audioNotifications: 'all',
		};

		return this.find(query);
	}

	findAlwaysNotifyDesktopUsersByRoomId(roomId) {
		const query = {
			rid: roomId,
			desktopNotifications: 'all',
		};

		return this.find(query);
	}

	findDontNotifyDesktopUsersByRoomId(roomId) {
		const query = {
			rid: roomId,
			desktopNotifications: 'nothing',
		};

		return this.find(query);
	}

	findAlwaysNotifyMobileUsersByRoomId(roomId) {
		const query = {
			rid: roomId,
			mobilePushNotifications: 'all',
		};

		return this.find(query);
	}

	findDontNotifyMobileUsersByRoomId(roomId) {
		const query = {
			rid: roomId,
			mobilePushNotifications: 'nothing',
		};

		return this.find(query);
	}

	findWithSendEmailByRoomId(roomId) {
		const query = {
			rid: roomId,
			emailNotifications: {
				$exists: true,
			},
		};

		return this.find(query, { fields: { emailNotifications: 1, u: 1 } });
	}

	findNotificationPreferencesByRoom(query/* { roomId: rid, desktopFilter: desktopNotifications, mobileFilter: mobilePushNotifications, emailFilter: emailNotifications }*/) {
		return this._db.find(query, {
			fields: {

				// fields needed for notifications
				rid: 1,
				t: 1,
				u: 1,
				name: 1,
				fname: 1,
				code: 1,

				// fields to define if should send a notification
				ignored: 1,
				audioNotifications: 1,
				audioNotificationValue: 1,
				desktopNotificationDuration: 1,
				desktopNotifications: 1,
				mobilePushNotifications: 1,
				emailNotifications: 1,
				disableNotifications: 1,
				muteGroupMentions: 1,
				userHighlights: 1,
			},
		});
	}

	findAllMessagesNotificationPreferencesByRoom(roomId) {
		const query = {
			rid: roomId,
			'u._id': { $exists: true },
			$or: [
				{ desktopNotifications: { $in: ['all', 'mentions'] } },
				{ mobilePushNotifications: { $in: ['all', 'mentions'] } },
				{ emailNotifications: { $in: ['all', 'mentions'] } },
			],
		};

		return this._db.find(query, {
			fields: {
				'u._id': 1,
				audioNotifications: 1,
				audioNotificationValue: 1,
				desktopNotificationDuration: 1,
				desktopNotifications: 1,
				mobilePushNotifications: 1,
				emailNotifications: 1,
				disableNotifications: 1,
				muteGroupMentions: 1,
			},
		});
	}

	resetUserE2EKey(userId) {
		this.update({ 'u._id': userId }, {
			$unset: {
				E2EKey: '',
			},
		}, {
			multi: true,
		});
	}

	findByUserIdWithoutE2E(userId, options) {
		const query = {
			'u._id': userId,
			E2EKey: {
				$exists: false,
			},
		};

		return this.find(query, options);
	}

	updateGroupE2EKey(_id, key) {
		const query = { _id };
		const update = { $set: { E2EKey: key } };
		this.update(query, update);
		return this.findOne({ _id });
	}

	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		if (scope) {
			query.rid = scope;
		}

		const subscriptions = this.find(query).fetch();

		const users = _.compact(_.map(subscriptions, function(subscription) {
			if (typeof subscription.u !== 'undefined' && typeof subscription.u._id !== 'undefined') {
				return subscription.u._id;
			}
		}));

		return Users.find({ _id: { $in: users } }, options);
	}

	// FIND ONE
	findOneByRoomIdAndUserId(roomId, userId, options) {
		const query = {
			rid: roomId,
			'u._id': userId,
		};

		return this.findOne(query, options);
	}

	findOneByRoomIdAndUsername(roomId, username, options) {
		const query = {
			rid: roomId,
			'u.username': username,
		};

		return this.findOne(query, options);
	}

	findOneByRoomNameAndUserId(roomName, userId) {
		const query = {
			name: roomName,
			'u._id': userId,
		};

		return this.findOne(query);
	}

	// FIND
	findByUserId(userId, options) {
		const query =			{ 'u._id': userId };

		return this.find(query, options);
	}

	findByUserIdAndType(userId, type, options) {
		const query = {
			'u._id': userId,
			t: type,
		};

		return this.find(query, options);
	}

	findByUserIdAndTypes(userId, types, options) {
		const query = {
			'u._id': userId,
			t: {
				$in: types,
			},
		};

		return this.find(query, options);
	}

	findByUserIdUpdatedAfter(userId, updatedAt, options) {
		const query = {
			'u._id': userId,
			_updatedAt: {
				$gt: updatedAt,
			},
		};

		return this.find(query, options);
	}

	findByRoomIdAndRoles(roomId, roles, options) {
		roles = [].concat(roles);
		const query = {
			rid: roomId,
			roles: { $in: roles },
		};

		return this.find(query, options);
	}

	findByType(types, options) {
		const query = {
			t: {
				$in: types,
			},
		};

		return this.find(query, options);
	}

	findByTypeAndUserId(type, userId, options) {
		const query = {
			t: type,
			'u._id': userId,
		};

		return this.find(query, options);
	}

	findByRoomId(roomId, options) {
		const query =			{ rid: roomId };

		return this.find(query, options);
	}

	findByRoomIdAndNotUserId(roomId, userId, options) {
		const query = {
			rid: roomId,
			'u._id': {
				$ne: userId,
			},
		};

		return this.find(query, options);
	}

	findByRoomAndUsersWithUserHighlights(roomId, users, options) {
		const query = {
			rid: roomId,
			'u._id': { $in: users },
			'userHighlights.0': { $exists: true },
		};

		return this.find(query, options);
	}

	findByRoomWithUserHighlights(roomId, options) {
		const query = {
			rid: roomId,
			'userHighlights.0': { $exists: true },
		};

		return this.find(query, options);
	}

	getLastSeen(options) {
		if (options == null) {
			options = {};
		}
		const query = { ls: { $exists: 1 } };
		options.sort = { ls: -1 };
		options.limit = 1;
		const [subscription] = this.find(query, options).fetch();
		return subscription && subscription.ls;
	}

	findByRoomIdAndUserIds(roomId, userIds, options) {
		const query = {
			rid: roomId,
			'u._id': {
				$in: userIds,
			},
		};

		return this.find(query, options);
	}

	findByRoomIdAndUserIdsOrAllMessages(roomId, userIds) {
		const query = {
			rid: roomId,
			$or: [
				{ 'u._id': { $in: userIds } },
				{ emailNotifications: 'all' },
			],
		};

		return this.find(query);
	}

	findByRoomIdWhenUserIdExists(rid, options) {
		const query = { rid, 'u._id': { $exists: 1 } };

		return this.find(query, options);
	}

	findByRoomIdWhenUsernameExists(rid, options) {
		const query = { rid, 'u.username': { $exists: 1 } };

		return this.find(query, options);
	}

	findUnreadByUserId(userId) {
		const query = {
			'u._id': userId,
			unread: {
				$gt: 0,
			},
		};

		return this.find(query, { fields: { unread: 1 } });
	}

	getMinimumLastSeenByRoomId(rid) {
		return this.db.findOne({
			rid,
		}, {
			sort: {
				ls: 1,
			},
			fields: {
				ls: 1,
			},
		});
	}

	// UPDATE
	archiveByRoomId(roomId) {
		const query =			{ rid: roomId };

		const update = {
			$set: {
				alert: false,
				open: false,
				archived: true,
			},
		};

		return this.update(query, update, { multi: true });
	}

	unarchiveByRoomId(roomId) {
		const query =			{ rid: roomId };

		const update = {
			$set: {
				alert: false,
				open: true,
				archived: false,
			},
		};

		return this.update(query, update, { multi: true });
	}

	hideByRoomIdAndUserId(roomId, userId) {
		const query = {
			rid: roomId,
			'u._id': userId,
		};

		const update = {
			$set: {
				alert: false,
				open: false,
			},
		};

		return this.update(query, update);
	}

	openByRoomIdAndUserId(roomId, userId) {
		const query = {
			rid: roomId,
			'u._id': userId,
		};

		const update = {
			$set: {
				open: true,
			},
		};

		return this.update(query, update);
	}

	setAsReadByRoomIdAndUserId(roomId, userId) {
		const query = {
			rid: roomId,
			'u._id': userId,
		};

		const update = {
			$set: {
				open: true,
				alert: false,
				unread: 0,
				userMentions: 0,
				groupMentions: 0,
				ls: new Date(),
			},
		};

		return this.update(query, update);
	}

	setAsUnreadByRoomIdAndUserId(roomId, userId, firstMessageUnreadTimestamp) {
		const query = {
			rid: roomId,
			'u._id': userId,
		};

		const update = {
			$set: {
				open: true,
				alert: true,
				ls: firstMessageUnreadTimestamp,
			},
		};

		return this.update(query, update);
	}

	setCustomFieldsDirectMessagesByUserId(userId, fields) {
		const query = {
			'u._id': userId,
			t: 'd',
		};
		const update = { $set: { customFields: fields } };
		const options = { multi: true };

		return this.update(query, update, options);
	}

	setFavoriteByRoomIdAndUserId(roomId, userId, favorite) {
		if (favorite == null) {
			favorite = true;
		}
		const query = {
			rid: roomId,
			'u._id': userId,
		};

		const update = {
			$set: {
				f: favorite,
			},
		};

		return this.update(query, update);
	}

	updateNameAndAlertByRoomId(roomId, name, fname) {
		const query =			{ rid: roomId };

		const update = {
			$set: {
				name,
				fname,
				alert: true,
			},
		};

		return this.update(query, update, { multi: true });
	}

	updateDisplayNameByRoomId(roomId, fname) {
		const query =			{ rid: roomId };

		const update = {
			$set: {
				fname,
				name: fname,
			},
		};

		return this.update(query, update, { multi: true });
	}

	setUserUsernameByUserId(userId, username) {
		const query =			{ 'u._id': userId };

		const update = {
			$set: {
				'u.username': username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	setNameForDirectRoomsWithOldName(oldName, name) {
		const query = {
			name: oldName,
			t: 'd',
		};

		const update = {
			$set: {
				name,
			},
		};

		return this.update(query, update, { multi: true });
	}

	incUnreadForRoomIdExcludingUserId(roomId, userId, inc) {
		if (inc == null) {
			inc = 1;
		}
		const query = {
			rid: roomId,
			'u._id': {
				$ne: userId,
			},
		};

		const update = {
			$set: {
				alert: true,
				open: true,
			},
			$inc: {
				unread: inc,
			},
		};

		return this.update(query, update, { multi: true });
	}

	incGroupMentionsAndUnreadForRoomIdExcludingUserId(roomId, userId, incGroup = 1, incUnread = 1) {
		const query = {
			rid: roomId,
			'u._id': {
				$ne: userId,
			},
		};

		const update = {
			$set: {
				alert: true,
				open: true,
			},
			$inc: {
				unread: incUnread,
				groupMentions: incGroup,
			},
		};

		return this.update(query, update, { multi: true });
	}

	incUserMentionsAndUnreadForRoomIdAndUserIds(roomId, userIds, incUser = 1, incUnread = 1) {
		const query = {
			rid: roomId,
			'u._id': {
				$in: userIds,
			},
		};

		const update = {
			$set: {
				alert: true,
				open: true,
			},
			$inc: {
				unread: incUnread,
				userMentions: incUser,
			},
		};

		return this.update(query, update, { multi: true });
	}

	ignoreUser({ _id, ignoredUser: ignored, ignore = true }) {
		const query = {
			_id,
		};
		const update = {
		};
		if (ignore) {
			update.$addToSet = { ignored };
		} else {
			update.$pull = { ignored };
		}

		return this.update(query, update);
	}

	setAlertForRoomIdExcludingUserId(roomId, userId) {
		const query = {
			rid: roomId,
			'u._id': {
				$ne: userId,
			},
			alert: { $ne: true },
		};

		const update = {
			$set: {
				alert: true,
			},
		};
		return this.update(query, update, { multi: true });
	}

	setOpenForRoomIdExcludingUserId(roomId, userId) {
		const query = {
			rid: roomId,
			'u._id': {
				$ne: userId,
			},
			open: { $ne: true },
		};

		const update = {
			$set: {
				open: true,
			},
		};
		return this.update(query, update, { multi: true });
	}

	setBlockedByRoomId(rid, blocked, blocker) {
		const query = {
			rid,
			'u._id': blocked,
		};

		const update = {
			$set: {
				blocked: true,
			},
		};

		const query2 = {
			rid,
			'u._id': blocker,
		};

		const update2 = {
			$set: {
				blocker: true,
			},
		};

		return this.update(query, update) && this.update(query2, update2);
	}

	unsetBlockedByRoomId(rid, blocked, blocker) {
		const query = {
			rid,
			'u._id': blocked,
		};

		const update = {
			$unset: {
				blocked: 1,
			},
		};

		const query2 = {
			rid,
			'u._id': blocker,
		};

		const update2 = {
			$unset: {
				blocker: 1,
			},
		};

		return this.update(query, update) && this.update(query2, update2);
	}

	updateCustomFieldsByRoomId(rid, cfields) {
		const query = { rid };
		const customFields = cfields || {};
		const update = {
			$set: {
				customFields,
			},
		};

		return this.update(query, update, { multi: true });
	}

	updateTypeByRoomId(roomId, type) {
		const query =			{ rid: roomId };

		const update = {
			$set: {
				t: type,
			},
		};

		return this.update(query, update, { multi: true });
	}

	addRoleById(_id, role) {
		const query =			{ _id };

		const update = {
			$addToSet: {
				roles: role,
			},
		};

		return this.update(query, update);
	}

	removeRoleById(_id, role) {
		const query =			{ _id };

		const update = {
			$pull: {
				roles: role,
			},
		};

		return this.update(query, update);
	}

	setArchivedByUsername(username, archived) {
		const query = {
			t: 'd',
			name: username,
		};

		const update = {
			$set: {
				archived,
			},
		};

		return this.update(query, update, { multi: true });
	}

	clearDesktopNotificationUserPreferences(userId) {
		const query = {
			'u._id': userId,
			desktopPrefOrigin: 'user',
		};

		const update = {
			$unset: {
				desktopNotifications: 1,
				desktopPrefOrigin: 1,
			},
		};

		return this.update(query, update, { multi: true });
	}

	updateDesktopNotificationUserPreferences(userId, desktopNotifications) {
		const query = {
			'u._id': userId,
			desktopPrefOrigin: {
				$ne: 'subscription',
			},
		};

		const update = {
			$set: {
				desktopNotifications,
				desktopPrefOrigin: 'user',
			},
		};

		return this.update(query, update, { multi: true });
	}

	clearMobileNotificationUserPreferences(userId) {
		const query = {
			'u._id': userId,
			mobilePrefOrigin: 'user',
		};

		const update = {
			$unset: {
				mobilePushNotifications: 1,
				mobilePrefOrigin: 1,
			},
		};

		return this.update(query, update, { multi: true });
	}

	updateMobileNotificationUserPreferences(userId, mobilePushNotifications) {
		const query = {
			'u._id': userId,
			mobilePrefOrigin: {
				$ne: 'subscription',
			},
		};

		const update = {
			$set: {
				mobilePushNotifications,
				mobilePrefOrigin: 'user',
			},
		};

		return this.update(query, update, { multi: true });
	}

	clearEmailNotificationUserPreferences(userId) {
		const query = {
			'u._id': userId,
			emailPrefOrigin: 'user',
		};

		const update = {
			$unset: {
				emailNotifications: 1,
				emailPrefOrigin: 1,
			},
		};

		return this.update(query, update, { multi: true });
	}

	updateEmailNotificationUserPreferences(userId, emailNotifications) {
		const query = {
			'u._id': userId,
			emailPrefOrigin: {
				$ne: 'subscription',
			},
		};

		const update = {
			$set: {
				emailNotifications,
				emailPrefOrigin: 'user',
			},
		};

		return this.update(query, update, { multi: true });
	}

	updateUserHighlights(userId, userHighlights) {
		const query = {
			'u._id': userId,
		};

		const update = {
			$set: {
				userHighlights,
			},
		};

		return this.update(query, update, { multi: true });
	}

	updateDirectFNameByName(name, fname) {
		const query = {
			t: 'd',
			name,
		};

		let update;
		if (fname) {
			update = {
				$set: {
					fname,
				},
			};
		} else {
			update = {
				$unset: {
					fname: true,
				},
			};
		}

		return this.update(query, update, { multi: true });
	}

	replaceServiceAccountBroadcastRoomName(previousUsername, username) {
		const query = { name: `broadcast_${ previousUsername }` };

		const update = {
			$set: {
				name: `broadcast_${ username }`,
			},
		};

		return this.update(query, update);
	}

	// INSERT
	createWithRoomAndUser(room, user, extraData) {
		const subscription = {
			open: false,
			alert: false,
			unread: 0,
			userMentions: 0,
			groupMentions: 0,
			ts: room.ts,
			rid: room._id,
			name: room.name,
			fname: room.fname,
			customFields: room.customFields,
			t: room.t,
			u: {
				_id: user._id,
				username: user.username,
				name: user.name,
			},
			...getDefaultSubscriptionPref(user),
			...extraData,
		};

		if (room.prid) {
			subscription.prid = room.prid;
		}

		const result = this.insert(subscription);

		Rooms.incUsersCountById(room._id);

		return result;
	}


	// REMOVE
	removeByUserId(userId) {
		const query = {
			'u._id': userId,
		};

		const roomIds = this.findByUserId(userId).map((s) => s.rid);

		const result = this.remove(query);

		if (Match.test(result, Number) && result > 0) {
			Rooms.incUsersCountByIds(roomIds, -1);
		}

		return result;
	}

	removeByRoomId(roomId) {
		const query = {
			rid: roomId,
		};

		const result = this.remove(query);

		if (Match.test(result, Number) && result > 0) {
			Rooms.incUsersCountById(roomId, - result);
		}

		return result;
	}

	removeByRoomIdAndUserId(roomId, userId) {
		const query = {
			rid: roomId,
			'u._id': userId,
		};

		const result = this.remove(query);

		if (Match.test(result, Number) && result > 0) {
			Rooms.incUsersCountById(roomId, - result);
		}

		return result;
	}

	// //////////////////////////////////////////////////////////////////
	// threads

	addUnreadThreadByRoomIdAndUserIds(rid, users, tmid) {
		if (!users) {
			return;
		}
		return this.update({
			'u._id': { $in: users },
			rid,
		}, {
			$addToSet: {
				tunread: tmid,
			},
		}, { multi: true });
	}

	removeUnreadThreadByRoomIdAndUserId(rid, userId, tmid) {
		return this.update({
			'u._id': userId,
			rid,
		}, {
			$pull: {
				tunread: tmid,
			},
		});
	}

	removeAllUnreadThreadsByRoomIdAndUserId(rid, userId) {
		const query = {
			rid,
			'u._id': userId,
		};

		const update = {
			$unset: {
				tunread: 1,
			},
		};

		return this.update(query, update);
	}
}

export default new Subscriptions('subscription', true);
