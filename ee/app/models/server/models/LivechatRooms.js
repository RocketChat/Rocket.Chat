import { LivechatRooms } from '../../../../../app/models/server/models/LivechatRooms';
import { logger } from '../../../livechat-enterprise/server/lib/logger';
import { addQueryRestrictionsToRoomsModel } from '../../../livechat-enterprise/server/lib/query.helper';
import { overwriteClassOnLicense } from '../../../license/server';

const applyRestrictions = (method) => function(originalFn, originalQuery, ...args) {
	const query = addQueryRestrictionsToRoomsModel(originalQuery);
	logger.queries.debug(() => `LivechatRooms.${ method } - ${ JSON.stringify(query) }`);
	return originalFn.call(this, query, ...args);
};

overwriteClassOnLicense('livechat-enterprise', LivechatRooms, {
	find: applyRestrictions('find'),
	findOne: applyRestrictions('findOne'),
	update: applyRestrictions('update'),
	remove: applyRestrictions('remove'),
	updateDepartmentAncestorsById(originalFn, _id, departmentAncestors) {
		const query = {
			_id,
		};
		const update = departmentAncestors ? { $set: { departmentAncestors } } : { $unset: { departmentAncestors: 1 } };
		return this.update(query, update);
	},
});


LivechatRooms.prototype.setTimeWhenRoomWillBeAbandoned = function(roomId, willBeAbandonedAt) {
	const query = {
		_id: roomId,
	};
	const update = {
		$set: {
			'omnichannel.abandonedAt': willBeAbandonedAt,
		},
	};

	return this.update(query, update);
};

LivechatRooms.prototype.findAbandonedOpenRooms = function(date) {
	return this.find({
		'omnichannel.abandonedAt': { $lte: date },
		waitingResponse: { $exists: false },
		closedAt: { $exists: false },
		open: true,
	});
};

LivechatRooms.prototype.setVisitorInactivityInSecondsById = function(_id, visitorInactivity) {
	const query = {
		_id,
	};
	const update = {
		$set: {
			'metrics.visitorInactivity': visitorInactivity,
		},
	};

	return this.update(query, update);
};

LivechatRooms.prototype.unsetAbandonedProperty = function() {
	return this.update({
		open: true,
		t: 'l',
	}, {
		$unset: { 'omnichannel.abandonedAt': 1 },
	}, {
		multi: true,
	});
};

export default LivechatRooms;
