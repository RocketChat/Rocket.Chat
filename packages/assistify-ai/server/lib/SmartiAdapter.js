/* globals SystemLogger, RocketChat */

import { SmartiProxy, verbs } from '../SmartiProxy';

/**
 * The SmartiAdpater can be understood as an interface for all interaction with Smarti triggered by Rocket.Chat server.
 * The SmartiAdapter sould not expose any methods that can directly be called by the client.
 * This adapter has no state, as all settings are fully buffered. Thus, the complete class is static.
 */
export class SmartiAdapter {

	/**
	 * Returns the webhook URL that reveives the analysis callback from Smarti.
	 */
	static get rocketWebhookUrl() {
		let rocketUrl = RocketChat.settings.get('Site_Url');
		rocketUrl = rocketUrl ? rocketUrl.replace(/\/?$/, '/') : rocketUrl;
		return `${ rocketUrl }api/v1/smarti.result/${ RocketChat.settings.get('Assistify_AI_RocketChat_Webhook_Token') }`;
	}

	/**
	 * Cretaes an empty conversation when a new "Smarti" enabled room is created.
	 * Currently called by createExpertise, createRequestFromRoom, createEquestFromRoomId.
	 *
	 * Todo: It would be nice to have this registered as a hook,
	 * but there's no good implementation of this in the core:
	 * See createRoom.js: RocketChat.callbacks.run('afterCreateChannel', owner, room);
	 *
	 * @param {String} rid
	 */
	static afterCreateChannel(rid) {
		const room = RocketChat.models.Rooms.findOneById(rid);
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

		let conversationId = SmartiAdapter.getConversationId(message.rid);
		if (!conversationId) {
			// create conversation
			SystemLogger.debug(`Conversation not found for room ${ message.rid }, create a new conversation.`);
			const room = RocketChat.models.Rooms.findOneById(message.rid);
			conversationId = SmartiAdapter._createAndPostConversation(room).id;
		}

		const requestBodyMessage = {
			'id': message._id,
			'time': message.ts,
			'origin': 'User', //user.type,
			'content': message.msg,
			'user': {
				'id': message.u._id
			},
			'metadata': {}
			//,"private" : false
		};

		if (message.origin === 'smartiWidget') {
			requestBodyMessage.metadata.skipAnalysis = true;
		}

		SystemLogger.debug(`Conversation ${ conversationId } found for channel ${ message.rid }, perform conversation update.`);
		let request_result;
		if (message.editedAt) {
			SystemLogger.debug('Trying to update existing message...');
			// update existing message
			request_result = SmartiProxy.propagateToSmarti(verbs.put, `conversation/${ conversationId }/message/${ requestBodyMessage.id }`, requestBodyMessage, (error) => {
				// 404 is expected if message doesn't exist
				if (!error.response || error.response.statusCode === 404) {
					SystemLogger.debug('Message not found!');
					SystemLogger.debug('Adding new message to conversation...');
					request_result = SmartiProxy.propagateToSmarti(verbs.post, `conversation/${ conversationId }/message`, requestBodyMessage);
				}
			});
		} else {
			SystemLogger.debug('Adding new message to conversation...');
			request_result = SmartiProxy.propagateToSmarti(verbs.post, `conversation/${ conversationId }/message`, requestBodyMessage);
		}

		if (request_result) {
			SmartiAdapter._getAnalysisResult(message.rid, conversationId);
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
			SmartiAdapter._getAnalysisResult(message.rid, conversationId);
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
			const res = SmartiProxy.propagateToSmarti(verbs.put, `/conversation/${ conversationId }/meta.status`, 'Complete');
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
	 * Returns the cached conversationId from the analyzed conversations cache (LivechatExternalMessage).
	 * If the conversation is not cached it will be retrieved from Smarti's legacy/rocket.chat service.
	 * Finally the mapping cache (roomID <-> smartiResult) is updated.
	 *
	 * @param {*} roomId - the room for which the Smarti conversationId shall be retrieved
	 */
	static getConversationId(roomId) {

		let conversationId = null;
		// uncached conversation
		SystemLogger.debug('Trying Smarti legacy service to retrieve conversation...');
		const conversation = SmartiProxy.propagateToSmarti(verbs.get, `legacy/rocket.chat?channel_id=${ roomId }`, null, (error) => {
			// 404 is expected if no mapping exists in Smarti
			if (error.response.statusCode === 404) {
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
			const conversationCacheEntry = RocketChat.models.LivechatExternalMessage.findOneByConversationId(conversationId);
			if (conversationCacheEntry && conversationCacheEntry.rid) {
				roomId = conversationCacheEntry.rid;
			} else {
				SystemLogger.error(`Smarti - no room found for conversation [ ${ conversationId } ] unable to notify room.`);
			}
		}
		SystemLogger.debug('Smarti - retieved analysis result =', JSON.stringify(analysisResult, null, 2));
		SystemLogger.debug(`Smarti - analysis complete -> update cache and notify room [ ${ roomId } ] for conversation [ ${ conversationId } ]`);
		RocketChat.Notifications.notifyRoom(roomId, 'newConversationResult', analysisResult);
	}

	/**
	 * Updates the mapping and triggers an asynchronous analysis.
	 */
	static _getAnalysisResult(roomId, conversationId) {

		// conversation updated or created => request analysis results
		SystemLogger.debug(`Smarti - conversation updated or created -> get analysis result asynch [ callback=${ SmartiAdapter.rocketWebhookUrl } ] for conversation: ${ conversationId } and room: ${ roomId }`);
		SmartiProxy.propagateToSmarti(verbs.get, `conversation/${ conversationId }/analysis?callback=${ SmartiAdapter.rocketWebhookUrl }`); // asynch
	}

	/**
	 * Triggers the re-synchronization with Smarti.
	 *
	 * @param {boolean} ignoreSyncFlag - if 'true' the dirty flag for outdated rooms and messages will be ignored. If 'false' only rooms and messages are synchronized that are marked as outdated.
	 */
	static resync(ignoreSyncFlag) {
		SystemLogger.info('Smarti resync triggered');

		if (!SmartiAdapter._smartiAvailable()) {
			return false;
		}

		// flush the cache
		if (ignoreSyncFlag) {
			SmartiAdapter._clearMapping();
		}

		let query = {};
		if (!ignoreSyncFlag || ignoreSyncFlag !== true) {
			query = { $or: [{ outOfSync: true }, { outOfSync: { $exists: false } }] };
		}

		query.t = 'r';
		const requests = RocketChat.models.Rooms.model.find(query).fetch();
		SystemLogger.info('Number of Requests to sync: ', requests.length);
		for (let i = 0; i < requests.length; i++) {
			Meteor.defer(() => SmartiAdapter._tryResync(requests[i]._id, ignoreSyncFlag));
		}

		query.t = 'e';
		const topics = RocketChat.models.Rooms.model.find(query).fetch();
		SystemLogger.info('Number of Topics to sync: ', topics.length);
		for (let i = 0; i < topics.length; i++) {
			Meteor.defer(() => SmartiAdapter._tryResync(topics[i]._id, ignoreSyncFlag));
		}

		query.t = 'l';
		const livechat = RocketChat.models.Rooms.model.find(query).fetch();
		SystemLogger.info('Number of Topics to sync: ', livechat.length);
		for (let i = 0; i < livechat.length; i++) {
			Meteor.defer(() => SmartiAdapter._tryResync(livechat[i]._id, ignoreSyncFlag));
		}

		return {
			message: 'sync-triggered-successfully'
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

	/**
	 * Performs the synchronization for a single room/conversation.
	 *
	 * @param {String} rid - the id of the room to sync
	 * @param {boolean} ignoreSyncFlag @see resync(ignoreSyncFlag)
	 */
	static _tryResync(rid, ignoreSyncFlag) {

		SystemLogger.debug('Sync messages for room: ', rid);

		// only resync rooms containing outdated messages, if a delta sync is requested
		const room = RocketChat.models.Rooms.findOneById(rid);
		if (!ignoreSyncFlag || ignoreSyncFlag !== true) {
			const unsync = RocketChat.models.Messages.find({ lastSync: { $exists: false }, rid, t: { $exists: false } }).fetch();
			if (unsync.length === 0 && !room.outOfSync) {
				SystemLogger.debug('Room is already in sync');
				return true;
			} else {
				SystemLogger.debug('Messages out of sync: ', unsync.length);
				// HACK: as we won't use the dirty flag for now, make sure the delta sync is not executed
				return true;
			}
		}

		// delete convervation from Smarti, if already exists
		const conversationId = SmartiAdapter.getConversationId(rid);
		if (conversationId) {
			SystemLogger.debug(`Conversation found ${ conversationId } - delete and create new conversation`);
			SmartiProxy.propagateToSmarti(verbs.delete, `conversation/${ conversationId }`, null);
		}

		// get the messages of the room and create a conversation from it
		let messages;
		if (room.closedAt) {
			messages = RocketChat.models.Messages.find({ rid, ts: { $lt: room.closedAt }, t: { $exists: false } }, { sort: { ts: 1 } }).fetch();
		} else {
			messages = RocketChat.models.Messages.find({ rid, t: { $exists: false } }, { sort: { ts: 1 } }).fetch();
		}
		const newSmartiConversation = SmartiAdapter._createAndPostConversation(room, messages);

		// get the analysis result (synchronously), update the cache and notify rooms
		// const analysisResult = SmartiProxy.propagateToSmarti(verbs.get, `conversation/${ newSmartiConversation.id }/analysis`);
		// SmartiAdapter.analysisCompleted(rid, newSmartiConversation.id, analysisResult);
		SystemLogger.debug(`Smarti analysis completed for conversation ${ newSmartiConversation.id }`);

		for (let i = 0; i < messages.length; i++) {
			Meteor.defer(() => SmartiAdapter._markMessageAsSynced(messages[i]._id));
		}
		SmartiAdapter._markRoomAsSynced(rid);

		// finally it's done
		SystemLogger.debug('Room Id: ', rid, ' is in sync now');
		return true;
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
		const conversationBody = {
			'meta': {
				'support_area': [supportArea],
				'channel_id': [room._id]
			},
			'user': {
				'id': room.u ? room.u._id : room.v._id
			},
			'messages': [],
			'context': {
				'contextType': 'rocket.chat'
			}
		};
		if (room.closedAt) {
			conversationBody.meta.status = 'Complete';
		}

		// add messages to conversation, if present
		if (messages && messages.length > 0) {
			conversationBody.messages = [];
			for (let i = 0; i < messages.length; i++) {
				const newMessage = {
					'id': messages[i]._id,
					'time': messages[i].ts,
					'origin': 'User',
					'content': messages[i].msg,
					'user': {
						'id': messages[i].u._id
					}
				};
				conversationBody.messages.push(newMessage);
			}
		}

		// post the conversation
		const conversation = SmartiProxy.propagateToSmarti(verbs.post, 'conversation', conversationBody, (error) => {
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
		const helpRequest = RocketChat.models.Rooms.findOne(room._id);
		let supportArea = room.parentRoomId || room.topic || room.expertise;
		if (!supportArea) {
			if (room.t === '') {
				supportArea = 'livechat';
			} else if (helpRequest && helpRequest.supportArea) {
				supportArea = helpRequest.supportArea;
			} else {
				supportArea = room.name;
			}
		}

		SystemLogger.debug('HelpRequest:', helpRequest);
		SystemLogger.debug('Room:', room);
		return supportArea;
	}

	/*
		Commented the resync sstatus cache since this lead to issues
		in the cache-sync of the base model:
		It seems as if the updates performed interfere with updates to the same collection
		triggered in Rooms.js(incMsgCountAndSetLastMessageById())
		Todo: Find a non-concurrent way of caching the sync status
	*/
	static _markMessageAsSynced(messageId) {
		SystemLogger.debug('_markMessageAsSynced', messageId);
		/* Todo: Find a non-concurrent way of caching the sync status

		const messageDB = RocketChat.models.Messages;
		const message = messageDB.findOneById(messageId);
		const lastUpdate = message ? message._updatedAt : 0;
		if (lastUpdate) {
			messageDB.model.update(
				{ _id: messageId },
				{
					$set: {
						lastSync: lastUpdate
					}
				});
			SystemLogger.debug('Message Id: ', messageId, ' has been synced');
		} else {
			SystemLogger.debug('Message Id: ', messageId, ' can not be synced');
		}
		*/
	}

	static _markRoomAsSynced(rid) {
		SystemLogger.debug('_markRoomAsSynced', rid);
		/* Todo: Find a non-concurrent way of caching the sync status
		RocketChat.models.Rooms.model.update(
			{ _id: rid },
			{
				$set: {
					outOfSync: false
				}
			});
		SystemLogger.debug('Room Id: ', rid, ' is in sync');
		*/
	}

	static _markRoomAsUnsynced(rid) {
		SystemLogger.debug('_markRoomAsUnsynced', rid);
		/* Todo: Find a non-concurrent way of caching the sync status
		RocketChat.models.Rooms.model.update(
			{ _id: rid },
			{
				$set: {
					outOfSync: true
				}
			});
		SystemLogger.debug('Room Id: ', rid, ' is out of sync');
		*/
	}

	static _updateMapping(roomId, conversationId) {

		if (!roomId && !conversationId) {
			const e = new Meteor.Error('Smarti - Unable to update mapping roomId or conversationId undefined');
			SystemLogger.error(e);
		}

		RocketChat.models.LivechatExternalMessage.update(
			{
				_id: roomId
			}, {
				rid: roomId,
				knowledgeProvider: 'smarti',
				conversationId
			}, {
				upsert: true
			}
		);
	}

	static _removeMapping(roomId) {
		RocketChat.models.LivechatExternalMessage.remove({ _id: roomId });
	}

	static _clearMapping() {
		RocketChat.models.LivechatExternalMessage.clear();
	}

	static _smartiAvailable() {
		// if Smarti is not available stop immediately
		const resp = SmartiProxy.propagateToSmarti(verbs.get, 'system/health', null, (error) => {
			if (error.statusCode !== 200) {
				const e = new Meteor.Error('Smarti not reachable!');
				SystemLogger.error('Stop synchronizing with Smarti immediately:', e);
				return false;
			}
		});
		if ('UP' !== JSON.parse(resp).status) {
			const e = new Meteor.Error('Smarti not healthy!');
			SystemLogger.error('Stop synchronizing with Smarti immediately:', e);
			return false;
		}
		return true;
	}
}
