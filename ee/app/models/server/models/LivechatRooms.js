import { LivechatRooms } from '../../../../../app/models/server/models/LivechatRooms';
import { logger } from '../../../livechat-enterprise/server/lib/logger';
import { addQueryRestrictionsToRoomsModel } from '../../../livechat-enterprise/server/lib/query.helper';

const _find = LivechatRooms.prototype.find;
const _findOne = LivechatRooms.prototype.findOne;
const _update = LivechatRooms.prototype.update;
const _remove = LivechatRooms.prototype.remove;

LivechatRooms.prototype.find = function(originalQuery, ...args) {
	const query = addQueryRestrictionsToRoomsModel(originalQuery);
	logger.queries.debug('LivechatRooms.find', JSON.stringify(query));
	return _find.call(this, query, ...args);
};

LivechatRooms.prototype.findOne = function(originalQuery, ...args) {
	const query = addQueryRestrictionsToRoomsModel(originalQuery);
	logger.queries.debug('LivechatRooms.findOne', JSON.stringify(query));
	return _findOne.call(this, query, ...args);
};

LivechatRooms.prototype.update = function(originalQuery, ...args) {
	const query = addQueryRestrictionsToRoomsModel(originalQuery);
	logger.queries.debug('LivechatRooms.update', JSON.stringify(query));
	return _update.call(this, query, ...args);
};

LivechatRooms.prototype.remove = function(originalQuery, ...args) {
	const query = addQueryRestrictionsToRoomsModel(originalQuery);
	logger.queries.debug('LivechatRooms.remove', JSON.stringify(query));
	return _remove.call(this, query, ...args);
};

LivechatRooms.prototype.updateDepartmentAncestorsById = function(_id, departmentAncestors) {
	const query = {
		_id,
	};
	const update = departmentAncestors ? { $set: { departmentAncestors } } : { $unset: { departmentAncestors: 1 } };
	return this.update(query, update);
};


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
