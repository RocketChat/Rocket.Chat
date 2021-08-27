import { callbacks } from '../../../../../app/callbacks/server';
import { addQueryRestrictionsToDepartmentsModel } from '../lib/query.helper';
import { hasRole } from '../../../../../app/authorization/server/functions/hasRole';
import { logger } from '../lib/logger';

callbacks.add('livechat.applyDepartmentRestrictions', (originalQuery = {}, { userId } = { userId: null }) => {
	if (!userId || !hasRole(userId, 'livechat-monitor')) {
		(logger as any).cb.debug('Skipping callback. No user id provided or user is not a monitor');
		return originalQuery;
	}

	(logger as any).cb.debug('Applying department query restrictions');
	return addQueryRestrictionsToDepartmentsModel(originalQuery);
}, callbacks.priority.HIGH, 'livechat-apply-department-restrictions');
