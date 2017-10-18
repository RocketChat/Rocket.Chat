/* globals _dbs */

Meteor.methods({
	'redlink:getStoredConversation'(conversationId) {
		if (Meteor.isServer) {
			const adapter = _dbs.RedlinkAdapterFactory.getInstance();

			return adapter.getStoredConversation(conversationId);
		}
	}
});
