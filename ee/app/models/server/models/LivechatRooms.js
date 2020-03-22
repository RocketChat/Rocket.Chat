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

export default LivechatRooms;
