import { Meteor } from 'meteor/meteor';
import { SystemLogger } from '../../../../logger/server';
import { SmartiProxy, verbs } from '../SmartiProxy';
import { SmartiAdapter } from '../lib/SmartiAdapter';
import { RateLimiter } from '../../../../lib/server/lib';
import { hasPermission } from '../../../../authorization/server';
import { Subscriptions } from '../../../../models/server/';
import { Rooms } from '../../../../models/server/';


/** @namespace RateLimiter.limitFunction */

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
		return RateLimiter.limitFunction(
			SmartiAdapter.getConversationId, 5, 1000, {
				userId(userId) {
					return !hasPermission(userId, 'send-many-messages');
				},
			}
		)(channelId);
	},

	/**
	 * Returns the analyzed conversation by id.
	 *
	 * @param {String} conversationId - the conversation to retrieve
	 *
	 * @returns {Object} - the analysed conversation
	 */
	getConversation(conversationId) {
		return RateLimiter.limitFunction(
			SmartiProxy.propagateToSmarti, 5, 1000, {
				userId(userId) {
					return !hasPermission(userId, 'send-many-messages');
				},
			}
		)(verbs.get, `conversation/${ conversationId }/analysis`, null, null, (error) => {
			// 404 is expected if no mapping exists
			if (error.response && error.response.statusCode === 404) {
				return null;
			}
		});
	},

	/**
	 * This method provides the client a handler to request the asynchronous analysis of a room's messages
	 * It can e. g. be issued from the widget once it's opened
	 * @param {*} roomId The ID of the Rocket.Chat room which shall be analyzed
	 */
	analyze(roomId) {
		return RateLimiter.limitFunction(
			SmartiAdapter.triggerAnalysis, 5, 1000, {
				userId(userId) {
					return !hasPermission(userId, 'send-many-messages');
				},
			}
		)(roomId);
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
		return RateLimiter.limitFunction(
			SmartiProxy.propagateToSmarti, 5, 1000, {
				userId(userId) {
					return !hasPermission(userId, 'send-many-messages');
				},
			}
		)(verbs.get, `conversation/${ conversationId }/analysis/template/${ templateIndex }/result/${ creator }`, { start, rows });
	},

	searchConversations(queryParams) {

		function unique(value, index, array) {
			return array.indexOf(value) === index;
		}

		const solrFilterBooleanLimit = 256; // there is a limit for boolean expressinos in a filter query of default 1024 and an additional limiter by the HTTP-server. Experiments showed this limit as magic number.
		const findOptions = { limit: solrFilterBooleanLimit, sort: { ts: -1 }, fields: { _id: 1 } };
		const subscribedRooms = Subscriptions.find({ 'u._id': Meteor.userId() }, { limit: solrFilterBooleanLimit, sort: { ts: -1 }, fields: { rid: 1 } }).fetch().map((subscription) => subscription.rid);
		const publicChannels = hasPermission(Meteor.userId(), 'view-c-room') ? Rooms.find({ t: 'c' }, findOptions).fetch().map((room) => room._id) : [];
		const livechats = hasPermission(Meteor.userId(), 'view-l-room') ? Rooms.find({ t: 'l' }, findOptions).fetch().map((room) => room._id) : [];

		const accessibleRooms = livechats.concat(subscribedRooms).concat(publicChannels);

		let fq = `${ accessibleRooms.filter(unique).slice(0, solrFilterBooleanLimit).join(' OR ') }`;
		fq = fq ? { fq: `meta_channel_id:(${ fq })` } : { fq: 'meta_channel_id:""' }; // fallback: if the user's not authorized to view any room, filter for "nothing"
		const params = Object.assign(queryParams, fq);

		const searchResult = RateLimiter.limitFunction(
			SmartiProxy.propagateToSmarti, 5, 1000, {
				userId(userId) {
					return !hasPermission(userId, 'send-many-messages');
				},
			}
		)(verbs.get, 'conversation/search', params);
		SystemLogger.debug('SearchResult: ', JSON.stringify(searchResult, null, 2));
		return searchResult;
	},
});


// //////////////////////////////////////////
// ////// LOAD THE SMARTI JavaScript ////////
// //////////////////////////////////////////

// TODO: Prevent writing JavaScript into a inline <script>-Tags
// TODO: It would be much better, having a RC-HTTP-Endpoint returning the plain JavaScript file, to be used like
// TODO: <script type="text/javascript" src="https://${ROCKET-CHAT-URL}/api/rocket.chat.js" />

let script;
let timeoutHandle;

function loadSmarti() {
	if (SmartiAdapter.isEnabled()) {
		let script = RateLimiter.limitFunction(
			SmartiProxy.propagateToSmarti, 5, 1000, {
				userId(userId) {
					return !hasPermission(userId, 'send-many-messages');
				},
			}
		)(verbs.get, 'plugin/v1/rocket.chat.js');
		if (!script.error && script) {
			// add pseudo comment in order to make the script appear in the frontend as a file. This makes it de-buggable
			script = `${ script } //# sourceURL=SmartiWidget.js`;
		} else {
			SystemLogger.error('Could not load Smarti script from', '${SMARTI-SERVER}/plugin/v1/rocket.chat.js');
			throw new Meteor.Error('no-smarti-ui-script', 'no-smarti-ui-script');
		}
		return script;
	} else {
		return ''; // there is no script to be added, so return an empty source (and not null) - hte consumer expects a string
	}
}

function delayedReload() {
	if (timeoutHandle) {
		Meteor.clearTimeout(timeoutHandle);
	}
	timeoutHandle = Meteor.setTimeout(loadSmarti, 86400000);
}

/**
 * TODO: Think about limiting this methods
 */
Meteor.methods({

	/**
	 * This method can be used to explicitly trigger a reconfiguration of the Smarti-widget
	 */
	reloadSmarti() {
		script = undefined;
		script = loadSmarti();
		delayedReload();
		return {
			message: 'settings-reloaded-successfully',
		};
	},

	/**
	 * This method is triggered by the client in order to retrieve the most recent widget
	 */
	getSmartiUiScript() {
		if (!script) { // buffering
			script = loadSmarti();
			delayedReload();
		}
		return script;
	},
});
