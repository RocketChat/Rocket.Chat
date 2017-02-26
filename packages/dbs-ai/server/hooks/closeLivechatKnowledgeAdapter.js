/**
 * Notifies the knowledgeProvider about the end of a livechat conversation
 */
RocketChat.callbacks.add('livechat.closeRoom', function (room, closeProps={}) {
	try {
		const knowledgeAdapter = _dbs.getKnowledgeAdapter();
		if (knowledgeAdapter && knowledgeAdapter.onClose) {
			knowledgeAdapter.onClose(room);
		} else {
			SystemLogger.warn('No knowledge provider configured');
		}
	} catch (e) {
		SystemLogger.error('Error submitting closed conversation to knowledge provider ->', e);
	}

	let updatedRBInfo = room.rbInfo ? room.rbInfo : {};
	updatedRBInfo.knowledgeProviderUsage = closeProps.knowledgeProviderUsage;

}, RocketChat.callbacks.priority.LOW);
