import { LivechatDepartment } from '../../../../../app/models/server/models/LivechatDepartment';
import { logger } from '../../../livechat-enterprise/server/lib/logger';
import { addQueryRestrictionsToDepartmentsModel } from '../../../livechat-enterprise/server/lib/query.helper';
import { onLicense } from '../../../license/server';

const _find = LivechatDepartment.prototype.find;
const _findOne = LivechatDepartment.prototype.findOne;
const _update = LivechatDepartment.prototype.update;
const _remove = LivechatDepartment.prototype.remove;
const _createOrUpdateDepartment = LivechatDepartment.prototype.createOrUpdateDepartment;

LivechatDepartment.prototype.unfilteredFind = function(...args) {
	return _find.call(this, ...args);
};

LivechatDepartment.prototype.unfilteredFindOne = function(...args) {
	return _findOne.call(this, ...args);
};

LivechatDepartment.prototype.unfilteredUpdate = function(...args) {
	return _update.call(this, ...args);
};

LivechatDepartment.prototype.unfilteredRemove = function(...args) {
	return _remove.call(this, ...args);
};

onLicense('livechat-enterprise', () => {
	LivechatDepartment.prototype.find = function(originalQuery, ...args) {
		const query = addQueryRestrictionsToDepartmentsModel(originalQuery);
		logger.queries.debug('LivechatDepartment.find', JSON.stringify(query));
		return _find.call(this, query, ...args);
	};

	LivechatDepartment.prototype.findOne = function(originalQuery, ...args) {
		const query = addQueryRestrictionsToDepartmentsModel(originalQuery);
		logger.queries.debug('LivechatDepartment.findOne', JSON.stringify(query));
		return _findOne.call(this, query, ...args);
	};

	LivechatDepartment.prototype.update = function(originalQuery, ...args) {
		const query = addQueryRestrictionsToDepartmentsModel(originalQuery);
		logger.queries.debug('LivechatDepartment.update', JSON.stringify(query));
		return _update.call(this, query, ...args);
	};

	LivechatDepartment.prototype.remove = function(originalQuery, ...args) {
		const query = addQueryRestrictionsToDepartmentsModel(originalQuery);
		logger.queries.debug('LivechatDepartment.remove', JSON.stringify(query));
		return _remove.call(this, query, ...args);
	};

	LivechatDepartment.prototype.createOrUpdateDepartment = function(...args) {
		if (args.length > 2 && !args[1].type) {
			args[1].type = 'd';
		}

		return _createOrUpdateDepartment.apply(this, args);
	};

	LivechatDepartment.prototype.removeParentAndAncestorById = function(parentId) {
		const query = {
			parentId,
		};

		const update = {
			$unset: { parentId: 1 },
			$pull: { ancestors: parentId },
		};

		return this.update(query, update, { multi: true });
	};
});

export default LivechatDepartment;
