import { LivechatDepartmentRaw } from '../../../../../app/models/server/raw/LivechatDepartment';
import { logger } from '../../../livechat-enterprise/server/lib/logger';
import { addQueryRestrictionsToDepartmentsModel } from '../../../livechat-enterprise/server/lib/query.helper';
import { overwriteClassOnLicense } from '../../../license/server';

const applyRestrictions = (method) => function(originalFn, originalQuery, ...args) {
	const query = addQueryRestrictionsToDepartmentsModel(originalQuery);
	logger.queries.debug(() => `LivechatDepartmentRaw.${ method } - ${ JSON.stringify(query) }`);
	return originalFn.call(this, query, ...args);
};

overwriteClassOnLicense('livechat-enterprise', LivechatDepartmentRaw, {
	find: applyRestrictions('find'),
	findOne: applyRestrictions('findOne'),
	update: applyRestrictions('update'),
	remove: applyRestrictions('remove'),
});
