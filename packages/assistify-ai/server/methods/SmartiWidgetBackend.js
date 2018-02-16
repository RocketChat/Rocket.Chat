/* globals SystemLogger, RocketChat */

import {SmartiProxy, verbs} from '../SmartiProxy';

const querystring = require('querystring');

/** @namespace RocketChat.RateLimiter.limitFunction */

/**
 * The SmartiWidgetBackend handles all interactions triggered by the Smarti widget (not by Rocket.Chat hooks).
 * These 'Meteor.methods' are made available to be accessed via DDP, to be used in the Smarti widget.
 */
Meteor.methods({

	/**
	 * Returns the conversation Id for the given client and its channel.
	 *
	 * @param {String} channelId - the channel Id
	 *
	 * @returns {String} - the conversation Id
	 */
	getConversationId(channelId) {
		SystemLogger.debug(`Retrieving conversation ID for channel: ${ channelId }`);
		const m = RocketChat.models.LivechatExternalMessage.findOneById(channelId);
		if (m && m.conversationId) {
			return m.conversationId;
		} else {
			SystemLogger.debug('Smarti - Trying legacy service to retrieve conversation ID...');
			const conversation = RocketChat.RateLimiter.limitFunction(
				SmartiProxy.propagateToSmarti, 5, 1000, {
					userId(userId) {
						return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
					}
				}
			)(verbs.get, `legacy/rocket.chat?channel_id=${ channelId }`, null, (error) => {
				// 404 is expected if no mapping exists
				if (error.response.statusCode === 404) {
					return null;
				}
			});

			if (conversation && conversation.id) {
				let timestamp = conversation.messages &&
					conversation.messages[conversation.messages.length - 1] &&
					conversation.messages[conversation.messages.length - 1].time;

				if (!timestamp) {
					timestamp = conversation.lastModified;
				}

				// Store conversation ID and latest conversation timestamp
				RocketChat.models.LivechatExternalMessage.update(
					{
						_id: channelId
					}, {
						rid: channelId,
						knowledgeProvider: 'smarti',
						conversationId: conversation.id,
						ts: timestamp
					}, {
						upsert: true
					}
				);

				return conversation.id;
			} else {
				SystemLogger.debug(`Smarti - no conversation found for channel: ${ channelId }`);
				return null;
			}
		}
	},

	/**
	 * Returns the analyzed conversation by id.
	 *
	 * @param {String} conversationId - the conversation to retrieve
	 *
	 * @returns {Object} - the analysed conversation
	 */
	getConversation(conversationId) {
		return RocketChat.RateLimiter.limitFunction(
			SmartiProxy.propagateToSmarti, 5, 1000, {
				userId(userId) {
					return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
				}
			}
		)(verbs.get, `conversation/${ conversationId }/analysis`);
	},

	/**
	 * Returns the query builder results for the given conversation (used by Smarti widget)
	 *
	 * @param {String} conversationId - the conversation id to get results for
	 * @param {Number} templateIndex - the index of the template to get the results for
	 * @param {String} creator - the creator providing the suggestions
	 * @param {Number} start - the offset of the suggestion results (pagination)
	 * @param {Number} rows - number of the suggestion results (pagination)
	 *
	 * @returns {Object} - the suggestions
	 */
	getQueryBuilderResult(conversationId, templateIndex, creator, start, rows) {
		return RocketChat.RateLimiter.limitFunction(
			SmartiProxy.propagateToSmarti, 5, 1000, {
				userId(userId) {
					return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
				}
			}
		)(verbs.get, `conversation/${ conversationId }/analysis/template/${ templateIndex }/result/${ creator }?start=${ start }&rows=${ rows }`);
	},

	searchConversations(queryParams) {
		const queryString = querystring.stringify(queryParams);
		SystemLogger.debug('QueryString: ', queryString);
		return RocketChat.RateLimiter.limitFunction(
			SmartiProxy.propagateToSmarti, 5, 1000, {
				userId(userId) {
					return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
				}
			}
		)(verbs.get, `conversation/search?${ queryString }`);
	}
});


////////////////////////////////////////////
//////// LOAD THE SMARTI JavaScript ////////
////////////////////////////////////////////

// TODO: Prevent writing JavaScript into a inline <script>-Tags
// TODO: It would be much better, having a RC-HTTP-Endpoint returning the plain JavaScript file, to be used like
// TODO: <script type="text/javascript" src="https://${ROCKET-CHAT-URL}/api/rocket.chat.js" />

let script;
let timeoutHandle;

function loadSmarti() {

	let script = RocketChat.RateLimiter.limitFunction(
		SmartiProxy.propagateToSmarti, 5, 1000, {
			userId(userId) {
				return !RocketChat.authz.hasPermission(userId, 'send-many-messages');
			}
		}
	)(verbs.get, 'plugin/v1/rocket.chat.js');
	if (script) {
		// add pseudo comment in order to make the script appear in the frontend as a file. This makes it de-buggable
		script = `${ script } //# sourceURL=SmartiWidget.js`;
	} else {
		SystemLogger.error('Could not load Smarti script from', '${SMARTI-SERVER}/plugin/v1/rocket.chat.js');
		throw new Meteor.Error('no-smarti-ui-script', 'no-smarti-ui-script');
	}
	return script;
}

function delayedReload() {
	if (timeoutHandle) {
		Meteor.clearTimeout(timeoutHandle);
	}
	timeoutHandle = Meteor.setTimeout(loadSmarti, 86400000);
}

/**
 * This method can be used to explicitly trigger a reconfiguration of the Smarti-widget
 */
Meteor.methods({
	reloadSmarti() {
		script = undefined;
		script = loadSmarti();
		delayedReload();
		return {
			message: 'settings-reloaded-successfully'
		};
	}
});

/**
 * This method is triggered by the client in order to retrieve the most recent widget
 */
Meteor.methods({
	getSmartiUiScript() {
		if (!script) { //buffering
			script = loadSmarti();
			delayedReload();
		}
		return script;
	}
});
