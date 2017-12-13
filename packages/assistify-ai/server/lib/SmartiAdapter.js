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

		//TODO is this always a new one, what about update
		const helpRequest = RocketChat.models.HelpRequests.findOneByRoomId(message.rid);
		const supportArea = helpRequest ? helpRequest.supportArea : undefined;
		const requestBody = {
			// TODO: Should this really be in the responsibility of the Adapter?
			webhook_url: SmartiAdapter.rocketWebhookUrl,
			message_id: message._id,
			channel_id: message.rid,
			user_id: message.u._id,
			// username: message.u.username,
			text: message.msg,
			timestamp: message.ts,
			origin: message.origin,
			support_area: supportArea
		};
		return SmartiProxy.propagateToSmarti(verbs.post, `rocket/${ SmartiAdapter.smartiKnowledgeDomain }`, requestBody);
	}

	/**
	 * Event implementation that publishes the conversation in Smarti.
	 *
	 * @param room - the room to close
	 *
	 * @returns {*}
	 */
	static onClose(room) { //async

		// get conversation id
		const m = RocketChat.models.LivechatExternalMessage.findOneById(room._id);
		if (m) {
			SmartiProxy.propagateToSmarti(verbs.post, `conversation/${ m.conversationId }/publish`);
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
