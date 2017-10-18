/* globals RocketChat, SystemLogger*/

/**
 * Notifies the knowledgeProvider about the end of a livechat conversation
 */
import {getKnowledgeAdapter} from 'meteor/assistify:ai';
const _callbackOnClose = function(room) {
	try {
		const knowledgeAdapter = getKnowledgeAdapter();
		if (knowledgeAdapter && knowledgeAdapter.onClose) {
			knowledgeAdapter.onClose(room);
		} else {
			SystemLogger.warn('No knowledge provider configured');
		}
	} catch (e) {
		SystemLogger.error('Error submitting closed conversation to knowledge provider ->', e);
	}
};

RocketChat.callbacks.add('livechat.closeRoom', _callbackOnClose, RocketChat.callbacks.priority.LOW);
RocketChat.callbacks.add('assistify.closeRoom', _callbackOnClose, RocketChat.callbacks.priority.LOW);
