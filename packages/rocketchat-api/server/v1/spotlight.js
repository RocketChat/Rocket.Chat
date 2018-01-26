RocketChat.API.v1.addRoute('spotlight', { authRequired: true }, {
	get() {
		check(this.queryParams, {
			query: String
		});

		const { query } = this.queryParams;

		let result;
		Meteor.runAsUser(this.userId, () => result = Meteor.call('spotlight', query, null));

		return RocketChat.API.v1.success(result);
	}
});
