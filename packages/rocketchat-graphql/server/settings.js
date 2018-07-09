RocketChat.settings.addGroup('General', function() {
	this.section('GraphQL API', function() {
		this.add('Graphql_Enabled', false, { type: 'boolean', public: false });
		this.add('Graphql_CORS', true, { type: 'boolean', public: false, enableQuery: { _id: 'Graphql_Enabled', value: true } });
		this.add('Graphql_Subscription_Port', 3100, { type: 'int', public: false, enableQuery: { _id: 'Graphql_Enabled', value: true } });
	});
});
