import { useUserId } from '@rocket.chat/ui-contexts';

import { hasPermission } from '../../../../app/authorization/client';
import { settings } from '../../../../app/settings/client';

export const useCanAccessCannedResponses = () => {
	const uid = useUserId();
	return !!uid && settings.get('Canned_Responses_Enable') && hasPermission('view-canned-responses');
};
