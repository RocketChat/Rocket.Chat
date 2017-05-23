/**
 * Created by khurrum on 9/22/15.
 */

Meteor.methods({
	insertStroke: function (data) {
		check(data, {
			userId: String,
			sessionId: String,
			sessionEventId: Match.Optional(Match.Integer),
			roomId: String,
			boardId: Match.Integer,
			tool: String,
			params: Object,
			coords: [Number]
		});

		var user = Meteor.user();
		var subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(data.roomId, user._id);
		if (!subscription) {
			throw new Meteor.Error('no-subscription', '[methods] insertStroke -> No Subscription');
		}

		var stroke = _.extend(data, {
			userId: user._id,
			author: user.username,
			submitted: new Date()
		});
		var strokeId = Strokes.insert(stroke);
	},

	clearStrokes: function (rid) {
		check(rid, String);

		if (RocketChat.authz.hasRole(this.userId, ["admin", "moderator"], rid)) {
			Strokes.remove({roomId: rid});
		}
	}
});
