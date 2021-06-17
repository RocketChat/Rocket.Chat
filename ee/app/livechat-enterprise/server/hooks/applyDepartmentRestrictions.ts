import { callbacks } from '../../../../../server/utils/hooks';
import { addQueryRestrictionsToDepartmentsModel } from '../lib/query.helper';
import { hasRole } from '../../../../../app/authorization/server/functions/hasRole';

callbacks.add('livechat.applyDepartmentRestrictions', (originalQuery = {}, { userId } = { userId: null }) => {
	if (!userId || !hasRole(userId, 'livechat-monitor')) {
		return originalQuery;
	}

	return addQueryRestrictionsToDepartmentsModel(originalQuery);
}, callbacks.priority.HIGH, 'livechat-apply-department-restrictions');
