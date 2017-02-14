/**
 * Notifies the knowledgeProvider about the end of a livechat conversation
 */
RocketChat.callbacks.add('closeReisebuddyLivechat', function (room, closeProps) {
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
	RocketChat.models.Rooms.update(room._id, {$set: {rbInfo: updatedRBInfo}});

}, RocketChat.callbacks.priority.LOW);
