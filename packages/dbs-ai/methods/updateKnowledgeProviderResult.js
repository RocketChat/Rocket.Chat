/* globals _dbs */

Meteor.methods({
	'updateKnowledgeProviderResult': function(modifiedKnowledgeProviderResult) {
		if (Meteor.isServer) {
			if (!modifiedKnowledgeProviderResult) {
				return;
			}

			const knowledgeAdapter = _dbs.getKnowledgeAdapter();

			if (knowledgeAdapter instanceof _dbs.RedlinkAdapterFactory.getInstance().constructor &&
				modifiedKnowledgeProviderResult.knowledgeProvider === 'redlink') {
				return knowledgeAdapter.onResultModified(modifiedKnowledgeProviderResult);
			}
		}
	}
});
