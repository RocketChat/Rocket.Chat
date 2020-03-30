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


LivechatRooms.prototype.setTimeWhenRoomWillBeInactive = function(roomId, willBeInactiveAt) {
	const query = {
		_id: roomId,
	};
	const update = {
		$set: {
			'omnichannel.inactiveAt': willBeInactiveAt,
		},
	};

	return this.update(query, update);
};

LivechatRooms.prototype.findInactiveOpenRooms = function(date) {
	return this.find({
		'omnichannel.inactiveAt': { $lte: date },
		'omnichannel.frozen': { $exists: false },
		open: true,
	});
};

LivechatRooms.prototype.freezeRoomById = function(_id) {
	return this.update({ _id }, { $set: { 'omnichannel.frozen': true } });
};

LivechatRooms.prototype.setVisitorInactivityInSecondsByRoomId = function(roomId, visitorInactivity) {
	const query = {
		_id: roomId,
	};
	const update = {
		$set: {
			'metrics.visitorInactivity': visitorInactivity,
		},
	};

	return this.update(query, update);
};

LivechatRooms.prototype.unsetInactivityPropertyById = function(_id) {
	return this.update({ _id }, { $unset: { 'omnichannel.inactiveAt': 1 } });
};

export default LivechatRooms;
