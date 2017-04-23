Template.redlinkQueries.helpers({
	queryContext(query, queryIndex) {
		const instance = Template.instance();

		function hasInlineSupport(item) {
			return item.inlineResultSupport === true;
		}

		const queriesWithInlineSupport = instance.data.queries
			.filter(hasInlineSupport);

		return {
			query: query,
			maxConfidence: Math.max(...queriesWithInlineSupport.map((query) => query.confidence)),
			roomId: instance.data.roomId,
			templateIndex: instance.data.templateIndex,
			queryIndex: queryIndex
		};
	},
	isInlineResult(query) {
		// TODO: dirty hack, need to handle client triggered results having an inline result in some better way
		if (query) { return query.inlineResultSupport || query.creator === 'dbsearch'; }
		return false;
	}
});

Template.redlinkQueries.events({});

Template.redlinkQueries.onCreated(function() {
	Template.redlinkQueries.utilities.addCleanupActivity(()=>Session.set('messageMetadata', null));

	RocketChat.callbacks.add('afterSaveMessage', (message) => {
		const bufferedMetadata = Session.get('messageMetadata');
		if (bufferedMetadata && Meteor.user()._id === bufferedMetadata.user._id && bufferedMetadata.room === message.rid) {
			Meteor.call('addMessageMetadata', message, bufferedMetadata.metadata, (err, result) => {
				if (err) {
					console.error(err);
				} else {
					console.log(result);
				}
			});//, message, bufferedMetadata.metadata);
		}

		Template.redlinkQueries.utilities.resultsInteractionCleanup();

	});
});

Template.redlinkQueries.utilities = {
	cleanupCallbacks:[],
	resultsInteractionCleanup: function() {
		if (this.cleanupCallbacks) {
			this.cleanupCallbacks.forEach((cb)=>cb());
		}
	},
	addCleanupActivity: function(cb) {
		this.cleanupCallbacks.push(cb);
	}
};
