Meteor.methods({
	'redlink:getStoredConversation'(conversationId){
		if(Meteor.isServer) {
			const adapter = _dbs.RedlinkAdapterFactory.getInstance();
			const conversation = adapter.getStoredConversation(conversationId);

			return conversation;
		}
	}
});
