Meteor.methods({
	'redlink:getStoredConversation'(conversationId){
			const adapter = _dbs.RedlinkAdapterFactory.getInstance();
			const conversation = adapter.getStoredConversation(conversationId);

		return conversation;
	}
});
