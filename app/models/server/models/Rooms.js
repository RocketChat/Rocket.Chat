import _ from 'underscore';
import s from 'underscore.string';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { Base } from './_Base';
import Messages from './Messages';
import Subscriptions from './Subscriptions';

export class Rooms extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({ name: 1 }, { unique: true, sparse: true });
		this.tryEnsureIndex({ default: 1 }, { sparse: true });
		this.tryEnsureIndex({ featured: 1 }, { sparse: true });
		this.tryEnsureIndex({ muted: 1 }, { sparse: true });
		this.tryEnsureIndex({ t: 1 });
		this.tryEnsureIndex({ 'u._id': 1 });
		this.tryEnsureIndex({ ts: 1 });
		// Tokenpass
		this.tryEnsureIndex({ 'tokenpass.tokens.token': 1 }, { sparse: true });
		this.tryEnsureIndex({ tokenpass: 1 }, { sparse: true });
		// discussions
		this.tryEnsureIndex({ prid: 1 }, { sparse: true });
		this.tryEnsureIndex({ fname: 1 }, { sparse: true });
		// field used for DMs only
		this.tryEnsureIndex({ uids: 1 }, { sparse: true });

		this.tryEnsureIndex(
			{
				teamId: 1,
				teamDefault: 1,
			},
			{ sparse: true },
		);
	}

	findOneByIdOrName(_idOrName, options) {
		const query = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne(query, options);
	}

	setJitsiTimeout(_id, time) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				jitsiTimeout: time,
			},
		};

		return this.update(query, update);
	}

	setCallStatus(_id, status) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				callStatus: status,
			},
		};

		return this.update(query, update);
	}

	setCallStatusAndCallStartTime(_id, status) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				callStatus: status,
				webRtcCallStartTime: new Date(),
			},
		};

		return this.update(query, update);
	}

	findByTokenpass(tokens) {
		const query = {
			'tokenpass.tokens.token': {
				$in: tokens,
			},
		};

		return this._db.find(query).fetch();
	}

	setTokensById(_id, tokens) {
		const update = {
			$set: {
				'tokenpass.tokens.token': tokens,
			},
		};

		return this.update({ _id }, update);
	}

	findAllTokenChannels() {
		const query = {
			tokenpass: { $exists: true },
		};
		const options = {
			fields: {
				tokenpass: 1,
			},
		};
		return this._db.find(query, options);
	}

	setReactionsInLastMessage(roomId, lastMessage) {
		return this.update({ _id: roomId }, { $set: { 'lastMessage.reactions': lastMessage.reactions } });
	}

	unsetReactionsInLastMessage(roomId) {
		return this.update({ _id: roomId }, { $unset: { lastMessage: { reactions: 1 } } });
	}

	unsetAllImportIds() {
		const query = {
			importIds: {
				$exists: true,
			},
		};

		const update = {
			$unset: {
				importIds: 1,
			},
		};

		return this.update(query, update, { multi: true });
	}

	updateLastMessageStar(roomId, userId, starred) {
		let update;
		const query = { _id: roomId };

		if (starred) {
			update = {
				$addToSet: {
					'lastMessage.starred': { _id: userId },
				},
			};
		} else {
			update = {
				$pull: {
					'lastMessage.starred': { _id: userId },
				},
			};
		}

		return this.update(query, update);
	}

	setLastMessageSnippeted(roomId, message, snippetName, snippetedBy, snippeted, snippetedAt) {
		const query = { _id: roomId };

		const msg = `\`\`\`${message.msg}\`\`\``;

		const update = {
			$set: {
				'lastMessage.msg': msg,
				'lastMessage.snippeted': snippeted,
				'lastMessage.snippetedAt': snippetedAt || new Date(),
				'lastMessage.snippetedBy': snippetedBy,
				'lastMessage.snippetName': snippetName,
			},
		};

		return this.update(query, update);
	}

	setLastMessagePinned(roomId, pinnedBy, pinned, pinnedAt) {
		const query = { _id: roomId };

		const update = {
			$set: {
				'lastMessage.pinned': pinned,
				'lastMessage.pinnedAt': pinnedAt || new Date(),
				'lastMessage.pinnedBy': pinnedBy,
			},
		};

		return this.update(query, update);
	}

	setLastMessageAsRead(roomId) {
		return this.update(
			{
				_id: roomId,
			},
			{
				$unset: {
					'lastMessage.unread': 1,
				},
			},
		);
	}

	setSentiment(roomId, sentiment) {
		return this.update({ _id: roomId }, { $set: { sentiment } });
	}

	setDescriptionById(_id, description) {
		const query = {
			_id,
		};
		const update = {
			$set: {
				description,
			},
		};
		return this.update(query, update);
	}

	setStreamingOptionsById(_id, streamingOptions) {
		const update = {
			$set: {
				streamingOptions,
			},
		};
		return this.update({ _id }, update);
	}

	setTokenpassById(_id, tokenpass) {
		const update = {
			$set: {
				tokenpass,
			},
		};

		return this.update({ _id }, update);
	}

	setReadOnlyById(_id, readOnly, hasPermission) {
		if (!hasPermission) {
			throw new Error('You must provide "hasPermission" function to be able to call this method');
		}
		const query = {
			_id,
		};
		const update = {
			$set: {
				ro: readOnly,
			},
		};

		return this.update(query, update);
	}

	setDmReadOnlyByUserId(_id, ids, readOnly, reactWhenReadOnly) {
		const query = {
			uids: {
				$size: 2,
				$in: [_id],
			},
			...(ids && Array.isArray(ids) ? { _id: { $in: ids } } : {}),
			t: 'd',
		};

		const update = {
			$set: {
				ro: readOnly,
				reactWhenReadOnly,
			},
		};

		return this.update(query, update, { multi: true });
	}

	getDirectConversationsByUserId(_id, options) {
		return this.find({ t: 'd', uids: { $size: 2, $in: [_id] } }, options);
	}

	setAllowReactingWhenReadOnlyById = function (_id, allowReacting) {
		const query = {
			_id,
		};
		const update = {
			$set: {
				reactWhenReadOnly: allowReacting,
			},
		};
		return this.update(query, update);
	};

	setAvatarData(_id, origin, etag) {
		const update = {
			$set: {
				avatarOrigin: origin,
				avatarETag: etag,
			},
		};

		return this.update({ _id }, update);
	}

	unsetAvatarData(_id) {
		const update = {
			$set: {
				avatarETag: Date.now(),
			},
			$unset: {
				avatarOrigin: 1,
			},
		};

		return this.update({ _id }, update);
	}

	setSystemMessagesById = function (_id, systemMessages) {
		const query = {
			_id,
		};
		const update =
			systemMessages && systemMessages.length > 0
				? {
						$set: {
							sysMes: systemMessages,
						},
				  }
				: {
						$unset: {
							sysMes: '',
						},
				  };

		return this.update(query, update);
	};

	setE2eKeyId(_id, e2eKeyId, options) {
		const query = {
			_id,
		};

		const update = {
			$set: {
				e2eKeyId,
			},
		};

		return this.update(query, update, options);
	}

	findOneByImportId(_id, options) {
		const query = { importIds: _id };

		return this.findOne(query, options);
	}

	findOneByNonValidatedName(name, options) {
		const room = this.findOneByName(name, options);
		if (room) {
			return room;
		}

		let channelName = s.trim(name);
		try {
			// TODO evaluate if this function call should be here
			const { getValidRoomName } = Promise.await(import('../../../utils/lib/getValidRoomName'));
			channelName = getValidRoomName(channelName, null, { allowDuplicates: true });
		} catch (e) {
			console.error(e);
		}

		return this.findOneByName(channelName, options);
	}

	findOneByName(name, options) {
		const query = { name };

		return this.findOne(query, options);
	}

	findOneByNameAndNotId(name, rid) {
		const query = {
			_id: { $ne: rid },
			name,
		};

		return this.findOne(query);
	}

	findOneByDisplayName(fname, options) {
		const query = { fname };

		return this.findOne(query, options);
	}

	findOneByNameAndType(name, type, options) {
		const query = {
			name,
			t: type,
			teamId: {
				$exists: false,
			},
		};

		return this.findOne(query, options);
	}

	// FIND

	findById(roomId, options) {
		return this.find({ _id: roomId }, options);
	}

	findByIds(roomIds, options) {
		return this.find({ _id: { $in: [].concat(roomIds) } }, options);
	}

	findByType(type, options) {
		const query = { t: type };

		return this.find(query, options);
	}

	findByTypeInIds(type, ids, options) {
		const query = {
			_id: {
				$in: ids,
			},
			t: type,
		};

		return this.find(query, options);
	}

	findByTypes(types, discussion = false, options = {}) {
		const query = {
			t: {
				$in: types,
			},
			prid: { $exists: discussion },
		};
		return this.find(query, options);
	}

	findByUserId(userId, options) {
		const query = { 'u._id': userId };

		return this.find(query, options);
	}

	findBySubscriptionUserId(userId, options) {
		const data = Subscriptions.cachedFindByUserId(userId, { fields: { rid: 1 } })
			.fetch()
			.map((item) => item.rid);

		const query = {
			_id: {
				$in: data,
			},
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamId: {
						$exists: true,
					},
					_id: {
						$in: data,
					},
				},
			],
		};

		return this.find(query, options);
	}

	findBySubscriptionTypeAndUserId(type, userId, options) {
		const data = Subscriptions.findByUserIdAndType(userId, type, {
			fields: { rid: 1 },
		})
			.fetch()
			.map((item) => item.rid);

		const query = {
			t: type,
			_id: {
				$in: data,
			},
		};

		return this.find(query, options);
	}

	findBySubscriptionUserIdUpdatedAfter(userId, _updatedAt, options) {
		const ids = Subscriptions.findByUserId(userId, { fields: { rid: 1 } })
			.fetch()
			.map((item) => item.rid);

		const query = {
			_id: {
				$in: ids,
			},
			_updatedAt: {
				$gt: _updatedAt,
			},
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamId: {
						$exists: true,
					},
					_id: {
						$in: ids,
					},
				},
			],
		};

		return this.find(query, options);
	}

	findByNameContaining(name, discussion = false, options = {}) {
		const nameRegex = new RegExp(s.trim(escapeRegExp(name)), 'i');

		const query = {
			prid: { $exists: discussion },
			$or: [
				{ name: nameRegex },
				{
					t: 'd',
					usernames: nameRegex,
				},
			],
		};
		return this.find(query, options);
	}

	findByNameContainingAndTypes(name, types, discussion = false, options = {}) {
		const nameRegex = new RegExp(s.trim(escapeRegExp(name)), 'i');

		const query = {
			t: {
				$in: types,
			},
			prid: { $exists: discussion },
			$or: [
				{ name: nameRegex },
				{
					t: 'd',
					usernames: nameRegex,
				},
			],
		};
		return this.find(query, options);
	}

	findByNameAndType(name, type, options) {
		const query = {
			t: type,
			name,
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findByNameOrFNameAndType(name, type, options) {
		const query = {
			t: type,
			teamId: {
				$exists: false,
			},
			$or: [
				{
					name,
				},
				{
					fname: name,
				},
			],
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findByNameOrFNameAndRoomIdsIncludingTeamRooms(text, teamIds, roomIds, options) {
		const searchTerm = text && new RegExp(text, 'i');

		const query = {
			$and: [
				{ teamMain: { $exists: false } },
				{ prid: { $exists: false } },
				{
					$or: [
						{
							t: 'c',
							teamId: { $exists: false },
						},
						{
							t: 'c',
							teamId: { $in: teamIds },
						},
						...(roomIds?.length > 0
							? [
									{
										_id: {
											$in: roomIds,
										},
									},
							  ]
							: []),
					],
				},
				...(searchTerm
					? [
							{
								$or: [
									{
										name: searchTerm,
									},
									{
										fname: searchTerm,
									},
								],
							},
					  ]
					: []),
			],
		};

		return this._db.find(query, options);
	}

	findContainingNameOrFNameInIdsAsTeamMain(text, rids, options) {
		const query = {
			teamMain: true,
			$and: [
				{
					$or: [
						{
							t: 'p',
							_id: {
								$in: rids,
							},
						},
						{
							t: 'c',
						},
					],
				},
			],
		};

		if (text) {
			const regex = new RegExp(text, 'i');

			query.$and.push({
				$or: [
					{
						name: regex,
					},
					{
						fname: regex,
					},
				],
			});
		}

		return this._db.find(query, options);
	}

	findByNameAndTypeNotDefault(name, type, options) {
		const query = {
			t: type,
			name,
			default: {
				$ne: true,
			},
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamMain: true,
				},
			],
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findByNameAndTypesNotInIds(name, types, ids, options) {
		const query = {
			_id: {
				$nin: ids,
			},
			t: {
				$in: types,
			},
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamId: {
						$exists: true,
					},
					_id: {
						$in: ids,
					},
				},
				{
					// Also return the main room of public teams
					// this will have no effect if the method is called without the 'c' type, as the type filter is outside the $or group.
					teamMain: true,
					t: 'c',
				},
			],
			name,
		};

		// do not use cache
		return this._db.find(query, options);
	}

	findChannelAndPrivateByNameStarting(name, sIds, options) {
		const nameRegex = new RegExp(`^${s.trim(escapeRegExp(name))}`, 'i');

		const query = {
			t: {
				$in: ['c', 'p'],
			},
			name: nameRegex,
			teamMain: {
				$exists: false,
			},
			$or: [
				{
					teamId: {
						$exists: false,
					},
				},
				{
					teamId: {
						$exists: true,
					},
					_id: {
						$in: sIds,
					},
				},
			],
		};

		return this.find(query, options);
	}

	findByDefaultAndTypes(defaultValue, types, options) {
		const query = {
			default: defaultValue,
			t: {
				$in: types,
			},
		};

		return this.find(query, options);
	}

	findDirectRoomContainingAllUsernames(usernames, options) {
		const query = {
			t: 'd',
			usernames: { $size: usernames.length, $all: usernames },
			usersCount: usernames.length,
		};

		return this.findOne(query, options);
	}

	findOneDirectRoomContainingAllUserIDs(uid, options) {
		const query = {
			t: 'd',
			uids: { $size: uid.length, $all: uid },
		};

		return this.findOne(query, options);
	}

	findByTypeAndName(type, name, options) {
		const query = {
			name,
			t: type,
		};

		return this.findOne(query, options);
	}

	findByTypeAndNameOrId(type, identifier, options) {
		const query = {
			t: type,
			$or: [{ name: identifier }, { _id: identifier }],
		};

		return this.findOne(query, options);
	}

	findByTypeAndNameContaining(type, name, options) {
		const nameRegex = new RegExp(s.trim(escapeRegExp(name)), 'i');

		const query = {
			name: nameRegex,
			t: type,
		};

		return this.find(query, options);
	}

	findByTypeInIdsAndNameContaining(type, ids, name, options) {
		const nameRegex = new RegExp(s.trim(escapeRegExp(name)), 'i');

		const query = {
			_id: {
				$in: ids,
			},
			name: nameRegex,
			t: type,
		};

		return this.find(query, options);
	}

	findByTypeAndArchivationState(type, archivationstate, options) {
		const query = { t: type };

		if (archivationstate) {
			query.archived = true;
		} else {
			query.archived = { $ne: true };
		}

		return this.find(query, options);
	}

	findGroupDMsByUids(uids, options) {
		return this.find(
			{
				usersCount: { $gt: 2 },
				uids,
			},
			options,
		);
	}

	find1On1ByUserId(userId, options) {
		return this.find(
			{
				uids: userId,
				usersCount: 2,
			},
			options,
		);
	}

	// UPDATE
	addImportIds(_id, importIds) {
		importIds = [].concat(importIds);
		const query = { _id };

		const update = {
			$addToSet: {
				importIds: {
					$each: importIds,
				},
			},
		};

		return this.update(query, update);
	}

	archiveById(_id) {
		const query = { _id };

		const update = {
			$set: {
				archived: true,
			},
		};

		return this.update(query, update);
	}

	unarchiveById(_id) {
		const query = { _id };

		const update = {
			$set: {
				archived: false,
			},
		};

		return this.update(query, update);
	}

	setNameById(_id, name, fname) {
		const query = { _id };

		const update = {
			$set: {
				name,
				fname,
			},
		};

		return this.update(query, update);
	}

	setFnameById(_id, fname) {
		const query = { _id };

		const update = {
			$set: {
				fname,
			},
		};

		return this.update(query, update);
	}

	incMsgCountById(_id, inc = 1) {
		const query = { _id };

		const update = {
			$inc: {
				msgs: inc,
			},
		};

		return this.update(query, update);
	}

	incMsgCountAndSetLastMessageById(_id, inc, lastMessageTimestamp, lastMessage) {
		if (inc == null) {
			inc = 1;
		}
		const query = { _id };

		const update = {
			$set: {
				lm: lastMessageTimestamp,
			},
			$inc: {
				msgs: inc,
			},
		};

		if (lastMessage) {
			update.$set.lastMessage = lastMessage;
		}

		return this.update(query, update);
	}

	decreaseMessageCountById(_id, count = 1) {
		return this.incMsgCountById(_id, -count);
	}

	incUsersCountById(_id, inc = 1) {
		const query = { _id };

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.update(query, update);
	}

	incUsersCountByIds(ids, inc = 1) {
		const query = {
			_id: {
				$in: ids,
			},
		};

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.update(query, update, { multi: true });
	}

	incUsersCountNotDMsByIds(ids, inc = 1) {
		const query = {
			_id: {
				$in: ids,
			},
			t: { $ne: 'd' },
		};

		const update = {
			$inc: {
				usersCount: inc,
			},
		};

		return this.update(query, update, { multi: true });
	}

	setLastMessageById(_id, lastMessage) {
		const query = { _id };

		const update = {
			$set: {
				lastMessage,
			},
		};

		return this.update(query, update);
	}

	resetLastMessageById(_id, messageId = undefined) {
		const query = { _id };
		const lastMessage = Messages.getLastVisibleMessageSentWithNoTypeByRoomId(_id, messageId);

		const update = lastMessage
			? {
					$set: {
						lastMessage,
					},
			  }
			: {
					$unset: {
						lastMessage: 1,
					},
			  };

		return this.update(query, update);
	}

	replaceUsername(previousUsername, username) {
		const query = { usernames: previousUsername };

		const update = {
			$set: {
				'usernames.$': username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	replaceMutedUsername(previousUsername, username) {
		const query = { muted: previousUsername };

		const update = {
			$set: {
				'muted.$': username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	replaceUsernameOfUserByUserId(userId, username) {
		const query = { 'u._id': userId };

		const update = {
			$set: {
				'u.username': username,
			},
		};

		return this.update(query, update, { multi: true });
	}

	setJoinCodeById(_id, joinCode) {
		let update;
		const query = { _id };

		if ((joinCode != null ? joinCode.trim() : undefined) !== '') {
			update = {
				$set: {
					joinCodeRequired: true,
					joinCode,
				},
			};
		} else {
			update = {
				$set: {
					joinCodeRequired: false,
				},
				$unset: {
					joinCode: 1,
				},
			};
		}

		return this.update(query, update);
	}

	setUserById(_id, user) {
		const query = { _id };

		const update = {
			$set: {
				u: {
					_id: user._id,
					username: user.username,
				},
			},
		};

		return this.update(query, update);
	}

	setTypeById(_id, type) {
		const query = { _id };
		const update = {
			$set: {
				t: type,
			},
		};
		if (type === 'p') {
			update.$unset = { default: '' };
		}

		return this.update(query, update);
	}

	setTopicById(_id, topic) {
		const query = { _id };

		const update = {
			$set: {
				topic,
			},
		};

		return this.update(query, update);
	}

	setAnnouncementById(_id, announcement, announcementDetails) {
		const query = { _id };

		const update = {
			$set: {
				announcement,
				announcementDetails,
			},
		};

		return this.update(query, update);
	}

	setCustomFieldsById(_id, customFields) {
		const query = { _id };

		const update = {
			$set: {
				customFields,
			},
		};

		return this.update(query, update);
	}

	muteUsernameByRoomId(_id, username) {
		const query = { _id };

		const update = {
			$addToSet: {
				muted: username,
			},
			$pull: {
				unmuted: username,
			},
		};

		return this.update(query, update);
	}

	unmuteUsernameByRoomId(_id, username) {
		const query = { _id };

		const update = {
			$pull: {
				muted: username,
			},
			$addToSet: {
				unmuted: username,
			},
		};

		return this.update(query, update);
	}

	saveFeaturedById(_id, featured) {
		const query = { _id };
		const set = ['true', true].includes(featured);

		const update = {
			[set ? '$set' : '$unset']: {
				featured: true,
			},
		};

		return this.update(query, update);
	}

	saveDefaultById(_id, defaultValue) {
		const query = { _id };

		const update = {
			$set: {
				default: defaultValue,
			},
		};

		return this.update(query, update);
	}

	saveFavoriteById(_id, favorite, defaultValue) {
		const query = { _id };

		const update = {
			...(favorite && defaultValue && { $set: { favorite } }),
			...((!favorite || !defaultValue) && { $unset: { favorite: 1 } }),
		};

		return this.update(query, update);
	}

	saveRetentionEnabledById(_id, value) {
		const query = { _id };

		const update = {};

		if (value == null) {
			update.$unset = { 'retention.enabled': true };
		} else {
			update.$set = { 'retention.enabled': !!value };
		}

		return this.update(query, update);
	}

	saveRetentionMaxAgeById(_id, value) {
		const query = { _id };

		value = Number(value);
		if (!value) {
			value = 30;
		}

		const update = {
			$set: {
				'retention.maxAge': value,
			},
		};

		return this.update(query, update);
	}

	saveRetentionExcludePinnedById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.excludePinned': value === true,
			},
		};

		return this.update(query, update);
	}

	saveRetentionIgnoreThreadsById(_id, value) {
		const query = { _id };

		const update = {
			[value === true ? '$set' : '$unset']: {
				'retention.ignoreThreads': true,
			},
		};

		return this.update(query, update);
	}

	saveRetentionFilesOnlyById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.filesOnly': value === true,
			},
		};

		return this.update(query, update);
	}

	saveRetentionOverrideGlobalById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				'retention.overrideGlobal': value === true,
			},
		};

		return this.update(query, update);
	}

	saveEncryptedById(_id, value) {
		const query = { _id };

		const update = {
			$set: {
				encrypted: value === true,
			},
		};

		return this.update(query, update);
	}

	updateGroupDMsRemovingUsernamesByUsername(username, userId) {
		const query = {
			t: 'd',
			usernames: username,
			usersCount: { $gt: 2 },
		};

		const update = {
			$pull: {
				usernames: username,
				uids: userId,
			},
		};

		return this.update(query, update, { multi: true });
	}

	// INSERT
	createWithTypeNameUserAndUsernames(type, name, fname, user, usernames, extraData) {
		const room = {
			name,
			fname,
			t: type,
			usernames,
			msgs: 0,
			usersCount: 0,
			u: {
				_id: user._id,
				username: user.username,
			},
		};

		_.extend(room, extraData);

		room._id = this.insert(room);
		return room;
	}

	createWithIdTypeAndName(_id, type, name, extraData) {
		const room = {
			_id,
			ts: new Date(),
			t: type,
			name,
			usernames: [],
			msgs: 0,
			usersCount: 0,
		};

		_.extend(room, extraData);

		this.insert(room);
		return room;
	}

	createWithFullRoomData(room) {
		delete room._id;

		room._id = this.insert(room);
		return room;
	}

	// REMOVE
	removeById(_id) {
		const query = { _id };

		return this.remove(query);
	}

	removeByIds(ids) {
		return this.remove({ _id: { $in: ids } });
	}

	removeDirectRoomContainingUsername(username) {
		const query = {
			t: 'd',
			usernames: username,
			usersCount: { $lte: 2 },
		};

		return this.remove(query);
	}

	// ############################
	// Discussion
	findDiscussionParentByNameStarting(name, options) {
		const nameRegex = new RegExp(`^${s.trim(escapeRegExp(name))}`, 'i');

		const query = {
			t: {
				$in: ['c'],
			},
			name: nameRegex,
			archived: { $ne: true },
			prid: {
				$exists: false,
			},
		};

		return this.find(query, options);
	}

	setLinkMessageById(_id, linkMessageId) {
		const query = { _id };

		const update = {
			$set: {
				linkMessageId,
			},
		};

		return this.update(query, update);
	}

	countDiscussions() {
		return this.find({ prid: { $exists: true } }).count();
	}
}

export default new Rooms('room', true);
