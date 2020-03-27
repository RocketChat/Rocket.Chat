import { LivechatDepartmentRaw } from '../../../../../app/models/server/raw/LivechatDepartment';
import { logger } from '../../../livechat-enterprise/server/lib/logger';
import { addQueryRestrictionsToDepartmentsModel } from '../../../livechat-enterprise/server/lib/query.helper';

const _find = LivechatDepartmentRaw.prototype.find;
const _findOne = LivechatDepartmentRaw.prototype.findOne;
const _update = LivechatDepartmentRaw.prototype.update;
const _remove = LivechatDepartmentRaw.prototype.remove;

LivechatDepartmentRaw.prototype.find = function(originalQuery, ...args) {
	const query = addQueryRestrictionsToDepartmentsModel(originalQuery);
	logger.queries.debug('LivechatDepartmentRaw.find', JSON.stringify(query));
	return _find.call(this, query, ...args);
};

LivechatDepartmentRaw.prototype.findOne = function(originalQuery, ...args) {
	const query = addQueryRestrictionsToDepartmentsModel(originalQuery);
	logger.queries.debug('LivechatDepartmentRaw.findOne', JSON.stringify(query));
	return _findOne.call(this, query, ...args);
};

LivechatDepartmentRaw.prototype.update = function(originalQuery, ...args) {
	const query = addQueryRestrictionsToDepartmentsModel(originalQuery);
	logger.queries.debug('LivechatDepartmentRaw.update', JSON.stringify(query));
	return _update.call(this, query, ...args);
};

LivechatDepartmentRaw.prototype.remove = function(originalQuery, ...args) {
	const query = addQueryRestrictionsToDepartmentsModel(originalQuery);
	logger.queries.debug('LivechatDepartmentRaw.remove', JSON.stringify(query));
	return _remove.call(this, query, ...args);
};
