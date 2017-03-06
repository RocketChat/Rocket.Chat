/**
 * Created by OliverJaegle on 01.08.2016.
 */
// var _ = Npm.require('underscore');

_.extend(RocketChat.models.Rooms, {
	addHelpRequestInfo: function (room, helpRequestId) {
		const query = { _id: room._id };

		const update = {
			$set: {
				helpRequestId: helpRequestId,
				v: room.u //Depict the owner of the room as visitor, similar like in livechat
			}
		};

		return this.update(query, update);
	}
});
