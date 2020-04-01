import { LivechatDepartment } from '../../../../../app/models/server/models/LivechatDepartment';
import { logger } from '../../../livechat-enterprise/server/lib/logger';
import { addQueryRestrictionsToDepartmentsModel } from '../../../livechat-enterprise/server/lib/query.helper';
import { overwriteClassOnLicense } from '../../../license/server';

const { find, findOne, update, remove } = LivechatDepartment.prototype;

const applyRestrictions = (method) => function(originalFn, originalQuery, ...args) {
	const query = addQueryRestrictionsToDepartmentsModel(originalQuery);
	logger.queries.debug(() => `LivechatDepartment.${ method } - ${ JSON.stringify(query) }`);
	return originalFn.call(this, query, ...args);
};

overwriteClassOnLicense('livechat-enterprise', LivechatDepartment, {
	find: applyRestrictions('find'),
	findOne: applyRestrictions('findOne'),
	update: applyRestrictions('update'),
	remove: applyRestrictions('remove'),
	unfilteredFind(originalFn, ...args) {
		return find.apply(this, args);
	},
	unfilteredFindOne(originalFn, ...args) {
		return findOne.apply(this, args);
	},
	unfilteredUpdate(originalFn, ...args) {
		return update.apply(this, args);
	},
	unfilteredRemove(originalFn, ...args) {
		return remove.apply(this, args);
	},
	createOrUpdateDepartment(originalFn, ...args) {
		if (args.length > 2 && !args[1].type) {
			args[1].type = 'd';
		}

		return originalFn.apply(this, args);
	},
	removeParentAndAncestorById(originalFn, parentId) {
		const query = {
			parentId,
		};

		const update = {
			$unset: { parentId: 1 },
			$pull: { ancestors: parentId },
		};

		return this.update(query, update, { multi: true });
	},
});

export default LivechatDepartment;
