/* globals _dbs */

Meteor.methods({
	'redlink:retrieveResults'(roomId, templateIndex, creator) {

		if (Meteor.isServer) {
			const adapter = _dbs.RedlinkAdapterFactory.getInstance();

			return adapter.getQueryResults(roomId, templateIndex, creator);
		}
	}
});
