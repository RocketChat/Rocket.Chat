/**
 * Created by OliverJaegle on 01.08.2016.
 */
import s from 'underscore.string';

_.extend(RocketChat.models.Rooms, {
	addHelpRequestInfo(room, helpRequestId) {
		const query = {_id: room._id};

		const update = {
			$set: {
				helpRequestId,
				v: room.u //Depict the owner of the room as visitor, similar like in livechat
			}
		};

		return this.update(query, update);
	},
	findByNameContainingTypesAndTags(name, types, options) {
		const nameRegex = new RegExp(s.trim(s.escapeRegExp(name)), 'i');

		const $or = [];
		for (const type of Array.from(types)) {
			const obj = {name: nameRegex, t: type.type};
			if (type.username) {
				obj.usernames = type.username;
			}
			if (type.ids) {
				obj._id = {$in: type.ids};
			}
			$or.push(obj);
		}

		$or.push({tags: {$elemMatch: {'$regex': nameRegex}}});
		const query =
			{$or};

		return this._db.find(query, options); //do not use cache
	}
});
