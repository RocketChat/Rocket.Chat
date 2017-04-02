/**
 * Created by OliverJaegle on 01.08.2016.
 */
// var _ = Npm.require('underscore');

_.extend(RocketChat.models.Rooms, {
	addHelpRequestInfo: function (room, helpRequestId) {
		const query = {_id: room._id};

		const update = {
			$set: {
				helpRequestId: helpRequestId,
				v: room.u //Depict the owner of the room as visitor, similar like in livechat
			}
		};

		return this.update(query, update);
	},
	findByNameContainingTypesAndTags: function (name, types, options) {
		let nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), "i");

		let $or = [];
		for (let type of Array.from(types)) {
			let obj = {name: nameRegex, t: type.type};
			if (type.username != null) {
				obj.usernames = type.username;
			}
			if (type.ids != null) {
				obj._id = {$in: type.ids};
			}
			$or.push(obj);
		}

		$or.push({tags: {$elemMatch: {"$regex": nameRegex}}});
		let query =
			{$or};

		return this.find(query, options);
	}
});
