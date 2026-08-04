import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { usePermission } from '@rocket.chat/ui-contexts';

export const useCanEditCannedResponse = (cannedItem: IOmnichannelCannedResponse): boolean => {
	const canViewAllCannedResponses = usePermission('view-all-canned-responses');
	const canSaveCannedResponses = usePermission('save-canned-responses');
	const canSaveDepartmentCannedResponses = usePermission('save-department-canned-responses');

	return (
		canSaveCannedResponses ||
		canSaveDepartmentCannedResponses ||
		(canViewAllCannedResponses && cannedItem.scope !== 'global') ||
		cannedItem.scope === 'user'
	);
};
