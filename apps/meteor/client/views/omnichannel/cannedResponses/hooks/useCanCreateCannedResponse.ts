import { usePermission } from '@rocket.chat/ui-contexts';

export const useCanCreateCannedResponse = () => {
	const saveCannedResponsesPermission = usePermission('save-canned-responses');
	const saveDepartmentCannedResponsesPermission = usePermission('save-department-canned-responses');

	return saveCannedResponsesPermission || saveDepartmentCannedResponsesPermission;
};
