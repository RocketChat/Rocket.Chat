Template.redlinkQueries.helpers({
	queryContext(query, queryIndex){
		const instance = Template.instance();
		function hasInlineSupport(item) {
			return item.inlineResultSupport===true;
		}
		const queriesWithInlineSupport = instance.data.queries
			.filter(hasInlineSupport);

		return {
			query: query,
			maxConfidence: Math.max(...queriesWithInlineSupport.map((query) => query.confidence)),
			roomId: instance.data.roomId,
			templateIndex: instance.data.templateIndex,
			queryIndex: queryIndex
		}
	},
	dbSearchResult(query, index){
		return query.creator == "dbsearch";
	}
});

Template.redlinkQueries.events({

});
