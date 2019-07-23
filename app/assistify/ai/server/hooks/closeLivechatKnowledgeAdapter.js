/**
 * Notifies the knowledgeProvider about the end of a livechat conversation
 */
import { SystemLogger } from '../../../../logger/server';
import { callbacks } from '../../../../callbacks/server';
import { getKnowledgeAdapter } from '../lib/KnowledgeAdapterProvider';

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

callbacks.add('livechat.closeRoom', _callbackOnClose, callbacks.priority.LOW);
callbacks.add('assistify.closeRoom', _callbackOnClose, callbacks.priority.LOW);
