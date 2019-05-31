import { Meteor } from 'meteor/meteor';

import { SmartiProxy, verbs } from '../SmartiProxy';
import { assistifySmarti } from '../../models/AssistifySmarti';
import { Notifications } from '../../../../notifications/server';
import { settings } from '../../../../settings/server';
import { Messages, Rooms } from '../../../../models/server';
import { SystemLogger } from '../../../../logger/server';

let syncTimer = 0;

function terminateCurrentSync() {
	if (syncTimer) {
		Meteor.clearInterval(syncTimer);
	}

	syncTimer = 0;
}

function notifyClientsSmartiDirty(roomId, conversationId) {
	Notifications.notifyRoom(roomId, 'assistify-smarti-dirty', {
		roomId,
		conversationId,
	});
}
/**
 * The SmartiAdpater can be understood as an interface for all interaction with Smarti triggered by Rocket.Chat server.
 * The SmartiAdapter sould not expose any methods that can directly be called by the client.
 * This adapter has no state, as all settings are fully buffered. Thus, the complete class is static.
 */
export class SmartiAdapter {
	static isEnabled() {
		return !!settings.get('Assistify_AI_Enabled');
	}

	/**
	 * Returns the webhook URL that reveives the analysis callback from Smarti.
	 */
	static get rocketWebhookUrl() {
		let rocketUrl = settings.get('Assistify_AI_RocketChat_Callback_URL') || settings.get('Site_Url');
		rocketUrl = rocketUrl ? rocketUrl.replace(/\/?$/, '/') : rocketUrl;
		return `${ rocketUrl }api/v1/smarti.result/${ settings.get('Assistify_AI_RocketChat_Webhook_Token') }`;
	}

	/**
	 * Cretaes an empty conversation when a new "Smarti" enabled room is created.
	 * Currently called by createExpertise, createRequestFromRoom, createEquestFromRoomId.
	 *
	 * Todo: It would be nice to have this registered as a hook,
	 * but there's no good implementation of this in the core:
	 * See createRoom.js: callbacks.run('afterCreateChannel', owner, room);
	 *
	 * @param {String} rid
	 */
	static afterCreateChannel(rid) {
		const room = Rooms.findOneById(rid);
		SystemLogger.debug('Room created: ', room);
		SmartiAdapter._createAndPostConversation(room);
	}

	/**
	 * Event implementation that posts the message to Smarti.
	 *
	 * @param {object} message: {
	 *   _id: STRING,
	 *   rid: STRING,
	 *   u: {*},
	 *   msg: STRING,
	 *   ts: NUMBER,
	 *   origin: STRING
	 * }
	 */
	static onMessage(message) {
		try {
			let conversationId = SmartiAdapter.getConversationId(message.rid);
			if (!conversationId) {
				// create conversation
				SystemLogger.debug(`Conversation not found for room ${ message.rid }, create a new conversation.`);
				const room = Rooms.findOneById(message.rid);

				if (room.t === 'd') {
					return; // we'll not sync direct messages to Smarti for the time being
				}

				conversationId = SmartiAdapter._createAndPostConversation(room).id;
			}

			const requestBodyMessage = {
				id: message._id,
				time: message.ts,
				origin: 'User', // user.type,
				content: message.msg,
				user: {
					id: message.u._id,
				},
				metadata: {},
				// ,"private" : false
			};

			if (message.origin === 'smartiWidget') {
				requestBodyMessage.metadata.skipAnalysis = true;
			}

			SystemLogger.debug(`Conversation ${ conversationId } found for channel ${ message.rid }, perform conversation update.`);
			let request_result;
			if (message.editedAt) {
				SystemLogger.debug('Trying to update existing message...');
				// update existing message
				request_result = SmartiProxy.propagateToSmarti(verbs.put, `conversation/${ conversationId }/message/${ requestBodyMessage.id }`, null, requestBodyMessage, (error) => {
					// 404 is expected if message doesn't exist
					if (!error.response || error.response.statusCode === 404) {
						SystemLogger.debug('Message not found!');
						SystemLogger.debug('Adding new message to conversation...');
						request_result = SmartiProxy.propagateToSmarti(verbs.post, `conversation/${ conversationId }/message`, null, requestBodyMessage);
					}
				});
			} else {
				SystemLogger.debug('Adding new message to conversation...');
				request_result = SmartiProxy.propagateToSmarti(verbs.post, `conversation/${ conversationId }/message`, null, requestBodyMessage);
			}

			if (request_result) {
				Meteor.defer(() => SmartiAdapter._markMessageAsSynced(message._id));
				notifyClientsSmartiDirty(message.rid, conversationId);
				// autosync: If a room was not in sync, but the new message could be synced, try to sync the room again
				Meteor.defer(() => SmartiAdapter._tryResync(message.rid, false));
			} else {
				// if the message could not be synced this time, re-synch the complete room next time
				Meteor.defer(() => SmartiAdapter._markRoomAsUnsynced(message.rid));
			}
		} catch (e) {
			// Something unexpected happened - maybe Smarti is not available at all.
			// we at least cannot consider the sync successful
			Meteor.defer(() => SmartiAdapter._markRoomAsUnsynced(message.rid));
		}

		if (settings.get('Assistify_AI_Smarti_Inline_Highlighting_Enabled')) {
			Meteor.defer(() => SmartiAdapter.triggerAnalysis(message.rid));
		}
	}

	/**
	 * Event implementation for deletion of messages.
	 *
	 * @param {*} message - the message which has just been deleted
	 */
	static afterMessageDeleted(message) {
		const conversationId = SmartiAdapter.getConversationId(message.rid);
		if (conversationId) {
			SystemLogger.debug(`Smarti - Deleting message ${ message.rid } from conversation ${ conversationId }.`);
			SmartiProxy.propagateToSmarti(verbs.delete, `conversation/${ conversationId }/message/${ message._id }`);
			notifyClientsSmartiDirty(message.rid, conversationId);
		} else {
			SystemLogger.error(`Smarti - deleting message from conversation faild after delete message [ id: ${ message._id } ] from room [ id: ${ message.rid } ]`);
		}
	}

	/**
	 * Event implementation that publishes the conversation in Smarti.
	 *
	 * @param room - the room to close
	 *
	 * @returns {*}
	 */
	static onClose(room) {
		const conversationId = SmartiAdapter.getConversationId(room._id);

		if (conversationId) {
			const res = SmartiProxy.propagateToSmarti(verbs.put, `/conversation/${ conversationId }/meta.status`, null, 'Complete');
			if (!res) {
				Meteor.defer(() => SmartiAdapter._markRoomAsUnsynced(room._id));
			}
		} else {
			SystemLogger.error(`Smarti - setting conversation to complete faild when closing room [ ${ room._id } ]`);
		}
	}

	/**
	 * Propagates the deletion of a complete conversation to Smarti.
	 *
	 * @param room - the room just deleted
	 */
	static afterRoomErased(room) {
		const conversationId = SmartiAdapter.getConversationId(room._id);
		if (conversationId) {
			SystemLogger.debug(`Smarti - Deleting conversation ${ conversationId } after room ${ room._id } erased.`);
			SmartiProxy.propagateToSmarti(verbs.delete, `/conversation/${ conversationId }`);
			SmartiAdapter._removeMapping(room.id);
		} else {
			SystemLogger.error(`Smarti - deleting conversation faild after erasing room [ ${ room._id } ]`);
		}
	}

	/**
	 * Returns the cached conversationId from the analyzed conversations cache (model AssistifySmarti).
	 * If the conversation is not cached it will be retrieved from Smarti's legacy/rocket.chat service.
	 * Finally the mapping cache (roomID <-> smartiResult) is updated.
	 *
	 * @param {*} roomId - the room for which the Smarti conversationId shall be retrieved
	 */
	static getConversationId(roomId) {
		let conversationId = null;
		// uncached conversation
		SystemLogger.debug('Trying Smarti legacy service to retrieve conversation...');
		const conversation = SmartiProxy.propagateToSmarti(verbs.get, `legacy/rocket.chat?channel_id=${ roomId }`, null, null, (error) => {
			// 404 is expected if no mapping exists in Smarti
			if (error && error.response && error.response.statusCode === 404) {
				SystemLogger.warn(`No Smarti conversationId found (Server Error 404) for room: ${ roomId }`);
			} else {
				// some other error occurred
				SystemLogger.error(`Unexpected error while retrieving Smarti conversationId for room: ${ roomId }`, error.response);
			}
		});
		if (conversation && conversation.id) {
			// uncached conversation found in Smarti, update mapping ...
			conversationId = conversation.id;
			SmartiAdapter._updateMapping(roomId, conversationId);
		} else {
			SystemLogger.debug(`Smarti - no conversation found for room: ${ roomId }`);
		}
		return conversationId;
	}

	/**
	 * At any point in time when the anylsis for a room has been done (onClose, onMessage),
	 * analysisCompleted() updates the mapping and notifies the room, in order to reload the Smarti result representation
	 *
	 * @param roomId - the RC room Id
	 * @param conversationId  - the Smarti conversation Id
	 * @param analysisResult - the analysis result from Smarti
	 */
	static analysisCompleted(roomId, conversationId, analysisResult) {
		if (roomId === null) {
			const conversationCacheEntry = assistifySmarti.findOneByConversationId(conversationId);
			if (conversationCacheEntry && conversationCacheEntry.rid) {
				roomId = conversationCacheEntry.rid;
			} else {
				SystemLogger.error(`Smarti - no room found for conversation [ ${ conversationId } ] unable to notify room.`);
			}
		}
		SystemLogger.debug('Smarti - retieved analysis result =', JSON.stringify(analysisResult, null, 2));
		SystemLogger.debug(`Smarti - analysis complete -> update cache and notify room [ ${ roomId } ] for conversation [ ${ conversationId } ]`);
		Notifications.notifyRoom(roomId, 'newConversationResult', analysisResult);

		// update the affected message with the tokens extracted. This will trigger a re-rendering of the message
		SmartiAdapter.updateTokensInMessages(roomId, analysisResult);
	}

	static updateTokensInMessages(roomId, analysisResult) {
		const allTerms = analysisResult.tokens.reduce((terms, token) => terms.set(token.value,{value: token.value, type: token.type}), new Map()); //eslint-disable-line

		// we'll check whether the tokens found were contained in the last messages. We just pick a bunch (and not only the last one)
		// in order to handle potential message-sent-overlap while anlyzing
		const lastMessages = Messages.findByRoomId(roomId, { sort: { _updatedAt: -1 }, limit: 5 });
		lastMessages.forEach((message) => {
			let termsChanged = false;
			const alreadyRecognizedTokens = new Map();
			if (message.recognizedTokens) {
				message.recognizedTokens.forEach((token) => alreadyRecognizedTokens.set(token.value.toLowerCase(), token));
			}

			allTerms.forEach((token, term) => {
				if (message.msg.indexOf(term) > -1) {
					if (!alreadyRecognizedTokens.has(term.toLowerCase())) {
						termsChanged = true;
						alreadyRecognizedTokens.set(token.value, token);
					}
				}
			});
			if (termsChanged) {
				Messages.setRecognizedTokensById(message._id, Array.from(alreadyRecognizedTokens.values()));
			}
		});
	}

	/**
	 * Updates the mapping and triggers an asynchronous analysis.
	 */
	static triggerAnalysis(roomId) {
		const conversationId = SmartiAdapter.getConversationId(roomId);
		if (conversationId) {
			SmartiProxy.propagateToSmarti(verbs.get, `conversation/${ conversationId }/analysis`, { callback: SmartiAdapter.rocketWebhookUrl }); // asynch
		} else {
			SystemLogger.error(`No conversation found for roomId ${ roomId }`);
		}
	}

	/**
	 * Triggers the re-synchronization with Smarti.
	 *
	 * @param {boolean} ignoreSyncFlag - if 'true' the dirty flag for outdated rooms and messages will be ignored. If 'false' only rooms and messages are synchronized that are marked as outdated.
	 */
	static resync(ignoreSyncFlag) {
		terminateCurrentSync();

		SystemLogger.info('Smarti resync triggered');

		if (!SmartiAdapter._smartiAvailable()) {
			return false;
		}

		// flush the cache
		if (ignoreSyncFlag) {
			SmartiAdapter._clearMapping();
		}

		let syncModeQuery = {};
		if (!ignoreSyncFlag || ignoreSyncFlag !== true) {
			syncModeQuery = { $or: [{ outOfSync: true }, { outOfSync: { $exists: false } }] };
		}

		const roomTypesQuery = {
			$or: [
				{ t: 'c' },
				{ t: 'p' },
				{ t: 'l' },
			],
		};

		const query = { $and: [roomTypesQuery, syncModeQuery] };
		const roomProperties = {
			_id: 1,
			name: 1,
			closedAt: 1,
			outOfSync: 1,
			u: 1,
			v: 1,
		};

		const options = { fields: roomProperties, sort: { _id: 1 } };

		const batchSize = parseInt(settings.get('Assistify_AI_Resync_Batchsize')) || 10;
		const batchTimeout = parseInt(settings.get('Assistify_AI_Resync_Batch_Timeout')) || 1000;

		// determine the count once in order to have a maximum limit of batches - some healthy paranoia
		const totalCount = Rooms.model.find(query, options).count();
		const maxBatches = totalCount / batchSize + 1;
		let batchCount = 0;
		let resyncFailed = false;

		// Meteor cursors are not Mongo-cursors: No native paging is possible => do it manually
		const roomsCursor = Rooms.model.find(query, options);

		// unfortunately, there were memory garbage collection issues when using the intended
		// paging with skip and limit inside the syncBatch function (see previous revision)
		// => Fetch all the rooms upfront and page in the fetched array of rooms.
		const rooms = roomsCursor.fetch();

		function getNextBatch() {
			const begin = batchCount * batchSize;
			const end = begin + batchSize;
			batchCount++;

			return rooms.slice(begin, end);
		}

		function syncBatch() {
			const roomsBatch = getNextBatch();
			// trigger the syncronisation for the whole batch
			roomsBatch.forEach((room) => {
				SystemLogger.debug('Smarti syncing', room.name);
				resyncFailed = resyncFailed || !SmartiAdapter._tryResync(room, ignoreSyncFlag); // we're in a loop. We should not process the next item if an earlier one failed
			});

			if (roomsBatch.length === 0) {
				SystemLogger.success('Sync with Smarti completed');
				terminateCurrentSync();
				return;
			}

			if ((batchCount > maxBatches) || resyncFailed) {
				SystemLogger.error('Sync with Smarti was not successful - try a delta-sync');
				terminateCurrentSync();
			}
		}

		syncTimer = Meteor.setInterval(syncBatch, batchTimeout);

		return {
			message: 'sync-triggered-successfully',
		};
	}

	/**
	 * Performs the synchronization for a single room/conversation.
	 *
	 * @param {String} rid - the id of the room to sync
	 * @param {boolean} ignoreSyncFlag @see resync(ignoreSyncFlag)
	 */
	static resyncRoom(rid, ignoreSyncFlag) {
		Meteor.defer(() => SmartiAdapter._tryResync(rid, ignoreSyncFlag));
	}

	static getGoogleResult(params) {
		SystemLogger.info('getGoogleResult with params: ', params);
		return SmartiProxy.propagateToGoogle(verbs.get, params);
	}

	/**
	 * Performs the synchronization for a single room/conversation.
	 *
	 * @param {String} rid - the id of the room to sync
	 * @param {boolean} ignoreSyncFlag @see resync(ignoreSyncFlag)
	 */
	static _tryResync(room, ignoreSyncFlag) {
		try {
			SystemLogger.debug('Sync messages for room: ', room._id);

			const limit = parseInt(settings.get('Assistify_AI_Resync_Message_Limit')) || 1000;
			const messageFindOptions = { sort: { ts: 1 }, limit };

			// only resync rooms containing outdated messages, if a delta sync is requested
			if (!ignoreSyncFlag || ignoreSyncFlag !== true) {
				const unsync = Messages.find({ lastSync: { $exists: false }, rid: room._id, t: { $exists: false } }, messageFindOptions).count();
				if (unsync === 0) {
					SystemLogger.debug('Room is already in sync');
					SmartiAdapter._markRoomAsSynced(room._id); // this method was asked to resync, but there's nothing to be done => update the sync-metadata
					return true;
				}

				SystemLogger.debug('Messages out of sync: ', unsync.length);
			}

			// delete convervation from Smarti, if already exists
			const conversationId = SmartiAdapter.getConversationId(room._id);
			if (conversationId) {
				SystemLogger.debug(`Conversation found ${ conversationId } - delete and create new conversation`);
				SmartiProxy.propagateToSmarti(verbs.delete, `conversation/${ conversationId }`);
			}

			// get the messages of the room and create a conversation from it
			const messages = Messages.find({ rid: room._id, t: { $exists: false } }, messageFindOptions).fetch();
			const newSmartiConversation = SmartiAdapter._createAndPostConversation(room, messages);

			// get the analysis result (synchronously), update the cache and notify rooms
			// const analysisResult = SmartiProxy.propagateToSmarti(verbs.get, `conversation/${ newSmartiConversation.id }/analysis`);
			// SmartiAdapter.analysisCompleted(room._id, newSmartiConversation.id, analysisResult);
			SystemLogger.debug(`Smarti analysis completed for conversation ${ newSmartiConversation.id }`);

			for (let i = 0; i < messages.length; i++) {
				Meteor.defer(() => SmartiAdapter._markMessageAsSynced(messages[i]._id));
			}
			SmartiAdapter._markRoomAsSynced(room._id);

			// finally it's done
			return true;
		} catch (e) {
			return false;
		}
	}

	/**
	 * Builds a new conversation and posts it to Smarti.
	 * If messages are not passed, a conversation without messages will created for the given room in Smarti.
	 *
	 * @param {object} room - the room object
	 * @param {Array} messages - the messages of that room
	 *
	 * @throws {Meteor.Error} - if the conversation could not be created in Smarti
	 */
	static _createAndPostConversation(room, messages) {
		// create the conversation "header/metadata"
		const supportArea = SmartiAdapter._getSupportArea(room);
		let userId = '';

		// we need a small decision tree for the owner of a room. There even are channels without owner (GENERAL)!
		if (room.u) { // normal rooms
			userId = room.u._id;
		} else if (room.v) { // livechat rooms
			userId = room.v._id;
		}
		const conversationBody = {
			meta: {
				support_area: [supportArea],
				channel_id: [room._id],
			},
			user: {
				id: userId,
			},
			messages: [],
			context: {
				contextType: 'rocket.chat',
			},
		};
		if (room.closedAt) {
			conversationBody.meta.status = 'Complete';
		}

		// add messages to conversation, if present
		if (messages && messages.length > 0) {
			conversationBody.messages = [];
			for (let i = 0; i < messages.length; i++) {
				const newMessage = {
					id: messages[i]._id,
					time: messages[i].ts,
					origin: 'User',
					content: messages[i].msg,
					user: {
						id: messages[i].u._id,
					},
				};
				conversationBody.messages.push(newMessage);
			}
		}

		// post the conversation
		const conversation = SmartiProxy.propagateToSmarti(verbs.post, 'conversation', null, conversationBody, (error) => {
			SystemLogger.error(`Smarti - unexpected server error: ${ JSON.stringify(error, null, 2) } occured when creating a new conversation: ${ JSON.stringify(conversationBody, null, 2) }`);
		});
		if (!conversation && !conversation.id) {
			const e = new Meteor.Error('Could not create conversation for room:', room._id);
			SystemLogger.error(e);
		}
		SystemLogger.debug(`Smarti - New conversation with Id ${ conversation.id } created`);
		SmartiAdapter._updateMapping(room._id, conversation.id);
		return conversation;
	}

	/**
	 * Returns the support area for a given room.
	 * The "support_area" in Smarti is an optional property.
	 * A historic conversation belonging to the same support_are increases relevance.
	 *
	 * @param {object} room - the room to get the support area for
	 */
	static _getSupportArea(room) {
		let supportArea = room.topic || room.parentRoomId;
		if (!supportArea) {
			if (room.t === 'l') {
				supportArea = 'livechat';
			} else {
				supportArea = room.name;
			}
		}

		SystemLogger.debug('Room:', room);
		return supportArea;
	}

	static _markMessageAsSynced(messageId) {
		SystemLogger.debug('_markMessageAsSynced', messageId);

		const messageDB = Messages;
		const message = messageDB.findOneById(messageId);
		const lastUpdate = message ? message._updatedAt : 0;
		if (lastUpdate) {
			messageDB.model.update(
				{ _id: messageId },
				{
					$set: {
						lastSync: lastUpdate,
					},
				});
			SystemLogger.debug('Message Id: ', messageId, ' has been synced');
		} else {
			SystemLogger.debug('Message Id: ', messageId, ' can not be synced');
		}
	}

	static _markRoomAsSynced(rid) {
		SystemLogger.debug('_markRoomAsSynced', rid);
		Rooms.model.update(
			{ _id: rid },
			{
				$set: {
					outOfSync: false,
				},
			});
		SystemLogger.debug('Room Id: ', rid, ' is in sync now');
	}

	static _markRoomAsUnsynced(rid) {
		SystemLogger.debug('_markRoomAsUnsynced', rid);
		Rooms.model.update(
			{ _id: rid },
			{
				$set: {
					outOfSync: true,
				},
			});
		SystemLogger.debug('Room Id: ', rid, ' is out of sync');
	}

	static _updateMapping(roomId, conversationId) {
		if (!roomId && !conversationId) {
			const e = new Meteor.Error('Smarti - Unable to update mapping roomId or conversationId undefined');
			SystemLogger.error(e);
		}

		assistifySmarti.update(
			{
				_id: roomId,
			}, {
				rid: roomId,
				knowledgeProvider: 'smarti',
				conversationId,
			}, {
				upsert: true,
			}
		);
	}

	static _removeMapping(roomId) {
		assistifySmarti.remove({ _id: roomId });
	}

	static _clearMapping() {
		assistifySmarti.clear();
	}

	static _smartiAvailable() {
		// if Smarti is not available stop immediately
		const resp = SmartiProxy.propagateToSmarti(verbs.get, 'system/health', null, null, (error) => {
			if (error.statusCode !== 200) {
				const e = new Meteor.Error('Smarti not reachable!');
				SystemLogger.error('Stop synchronizing with Smarti immediately:', e);
			}
		});
		if (JSON.parse(resp).status !== 'UP') {
			const e = new Meteor.Error('Smarti not healthy!');
			SystemLogger.error('Stop synchronizing with Smarti immediately:', e);
			return false;
		}
		return true;
	}
}
