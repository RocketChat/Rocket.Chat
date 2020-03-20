import { LivechatRoomsRaw } from '../../../../../app/models/server/raw/LivechatRooms';
import { logger } from '../../../livechat-enterprise/server/lib/logger';
import { addQueryRestrictionsToRoomsModel } from '../../../livechat-enterprise/server/lib/query.helper';

const _find = LivechatRoomsRaw.prototype.find;
const _findOne = LivechatRoomsRaw.prototype.findOne;
const _update = LivechatRoomsRaw.prototype.update;
const _remove = LivechatRoomsRaw.prototype.remove;

LivechatRoomsRaw.prototype.find = function(originalQuery, ...args) {
	const query = addQueryRestrictionsToRoomsModel(originalQuery);
	logger.queries.debug('LivechatRoomsRaw.find', JSON.stringify(query));
	return _find.call(this, query, ...args);
};

LivechatRoomsRaw.prototype.findOne = function(originalQuery, ...args) {
	const query = addQueryRestrictionsToRoomsModel(originalQuery);
	logger.queries.debug('LivechatRoomsRaw.findOne', JSON.stringify(query));
	return _findOne.call(this, query, ...args);
};

LivechatRoomsRaw.prototype.update = function(originalQuery, ...args) {
	const query = addQueryRestrictionsToRoomsModel(originalQuery);
	logger.queries.debug('LivechatRoomsRaw.update', JSON.stringify(query));
	return _update.call(this, query, ...args);
};

LivechatRoomsRaw.prototype.remove = function(originalQuery, ...args) {
	const query = addQueryRestrictionsToRoomsModel(originalQuery);
	logger.queries.debug('LivechatRoomsRaw.remove', JSON.stringify(query));
	return _remove.call(this, query, ...args);
};
