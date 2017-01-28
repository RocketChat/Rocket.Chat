/**
 * Created by khurrum on 1/17/16.
 */

Template.drawingBoardMain.onCreated(function () {

});

Template.drawingBoardMain.helpers({
	subscribed: function () {
		return ChatSubscription.find({rid: this.rid}).count();
	},
	canJoin: function () {
		return ChatRoom.find({_id: this.rid, t: 'c'}).count();
	},
	roomName: function () {
		var roomData = Session.get('roomData' + this.rid);
		if (!roomData) return '';

		if (roomData.t == 'd') {
			var subscription = ChatSubscription.findOne({rid: this.rid}, {fields: {name: 1}});
			return subscription && subscription.name;
		} else {
			return roomData.name;
		}
	}
});

Template.drawingBoardMain.events({
	'click .join': function (event) {
		event.stopPropagation();
		event.preventDefault();
		Meteor.call('joinRoom', this.rid);
	}
});
