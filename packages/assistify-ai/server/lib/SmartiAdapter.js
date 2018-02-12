/* globals SystemLogger, RocketChat */

import {SmartiProxy, verbs} from '../SmartiProxy';

/**
 * The SmartiAdapter handles the interaction with Smarti triggered by Rocket.Chat hooks (not by Smarti widget).
 * This adapter has no state, as all settings are fully buffered. Thus, the complete class is static.
 */
export class SmartiAdapter {

	static get rocketWebhookUrl() {
		let rocketUrl = RocketChat.settings.get('Site_Url');
		rocketUrl = rocketUrl ? rocketUrl.replace(/\/?$/, '/') : rocketUrl;
		return `${ rocketUrl }api/v1/smarti.result/${ RocketChat.settings.get('Assistify_AI_RocketChat_Webhook_Token') }`;
	}

	static get smartiKnowledgeDomain() {
		return RocketChat.settings.get('Assistify_AI_Smarti_Domain');
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
	 *
	 * @returns {*}
	 */
	static onMessage(message) {

		//TODO trigger on message update, if needed
		const requestBodyMessage = {
			'id': message._id,
			'time': message.ts,
			'origin': 'User', //user.type,
			'content': message.msg,
			'user': {
				'id': message.u._id
			}
			//,"private" : false
		};

		SystemLogger.debug('Message:', requestBodyMessage);

		const m = RocketChat.models.LivechatExternalMessage.findOneById(message.rid);
		let analysisResult;
		let conversationId;

		// conversation exists for channel?
		if (m && m.conversationId) {
			conversationId = m.conversationId;
		} else {
			SystemLogger.debug('Smarti - Trying legacy service to retrieve conversation ID...');
			const conversation = SmartiProxy.propagateToSmarti(verbs.get, `legacy/rocket.chat?channel_id=${ message.rid }`);
			if (conversation && conversation.id) {
				conversationId = conversation.id;
			}
		}

		if (conversationId) {
			SystemLogger.info('Conversation found for channel');
			// add message to conversation
			SmartiProxy.propagateToSmarti(verbs.post, `conversation/${ conversationId }/message`, requestBodyMessage);
			// request analysis results
			analysisResult = SmartiProxy.propagateToSmarti(verbs.get, `conversation/${ conversationId }/analysis`);
		} else {
			SystemLogger.info('Conversation not found for channel');
			const helpRequest = RocketChat.models.HelpRequests.findOneByRoomId(message.rid);
			const supportArea = helpRequest ? helpRequest.supportArea : undefined;
			const room = RocketChat.models.Rooms.findOneById(message.rid);
			SystemLogger.debug('HelpRequest:', helpRequest);
			SystemLogger.debug('Room:', room);

			const requestBodyConversation = {
				'meta': {
					'support_area': [supportArea],
					'channel_id': [message.rid]
				},
				'user': {
					'id': room.u._id
				},
				'messages': [requestBodyMessage],
				'context': {
					'contextType': 'rocket.chat'
					/*
					"domain" : "test",
					"environment" : {

					}
					*/
				}
			};

			SystemLogger.debug('Creating conversation:', JSON.stringify(requestBodyConversation, null, '\t'));
			// create conversation, send message along and request analysis
			analysisResult = SmartiProxy.propagateToSmarti(verbs.post, 'conversation?analysis=true', requestBodyConversation);
			analysisResult = analysisResult ? analysisResult.analysis : null;
		}
		SystemLogger.debug('analysisResult:', JSON.stringify(analysisResult, null, '\t'));

		if (analysisResult && analysisResult.conversation) {
			// update/insert channel/conversation specific timestamp
			RocketChat.models.LivechatExternalMessage.update(
				{
					_id: message.rid
				}, {
					rid: message.rid,
					knowledgeProvider: 'smarti',
					conversationId: analysisResult.conversation,
					ts: message.ts
				}, {
					upsert: true
				}
			);

			RocketChat.Notifications.notifyRoom(message.rid, 'newConversationResult', analysisResult);
		}
	}

	/**
	 * Event implementation that publishes the conversation in Smarti.
	 *
	 * @param room - the room to close
	 *
	 * @returns {*}
	 */
	static onClose(room) { //async
		let conversationId;
		// get conversation id
		const m = RocketChat.models.LivechatExternalMessage.findOneById(room._id);
		if (m && m.conversationId) {
			conversationId = m.conversationId;
		} else {
			SystemLogger.debug('Smarti - Trying legacy service to retrieve conversation ID...');
			const conversation = SmartiProxy.propagateToSmarti(verbs.get, `legacy/rocket.chat?channel_id=${ room._id }`);
			if (conversation && conversation.id) {
				conversationId = conversation.id;
			}
		}
		if (conversationId) {
			SmartiProxy.propagateToSmarti(verbs.put, `/conversation/${ conversationId }/meta.status`, 'Complete');
		} else {
			SystemLogger.error(`Smarti - closing room failed: No conversation id for room: ${ room._id }`);
		}
	}

	/**
	 * This method provides an implementation for a hook registering an asynchronously sent response from Smarti to RocketChat
	 *
	 * @param roomId
	 * @param smartiConversationId
	 * @param token
	 */
	static analysisCompleted(roomId, smartiConversationId, token) {
		RocketChat.models.LivechatExternalMessage.update(
			{
				_id: roomId
			}, {
				rid: roomId,
				knowledgeProvider: 'smarti',
				conversationId: smartiConversationId,
				token,
				ts: new Date()
			}, {
				upsert: true
			}
		);

		RocketChat.Notifications.notifyRoom(roomId, 'newConversationResult', RocketChat.models.LivechatExternalMessage.findOneById(roomId));
	}
}
