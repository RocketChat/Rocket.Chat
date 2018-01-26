/**
	This API returns the result of a query of rooms
	and users, using Meteor's Spotlight method.

	Method: GET
	Route: api/v1/spotlight
	Query params:
		- query: The term to be searched.
 */
RocketChat.API.v1.addRoute('spotlight', { authRequired: true }, {
	get() {
		check(this.queryParams, {
			query: String
		});

		const { query } = this.queryParams;

		let result;
		Meteor.runAsUser(this.userId, () =>
			result = Meteor.call('spotlight', query, null, {
				rooms: true,
				users: true
			})
		);

		return RocketChat.API.v1.success(result);
	}
});
