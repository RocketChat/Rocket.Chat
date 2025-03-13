import { usePermission, useSetting, useUserId } from '@rocket.chat/ui-contexts';

export const useCanAccessCannedResponses = () => {
	const uid = useUserId();
	const isCannedResponsesEnabled = useSetting('Canned_Responses_Enable') as boolean;
	const canViewCannedResponses = usePermission('view-canned-responses') as boolean;

	return !!uid && isCannedResponsesEnabled && canViewCannedResponses;
};
