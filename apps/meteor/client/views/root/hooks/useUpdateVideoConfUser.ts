import { useConnectionStatus, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { VideoConfManager } from '../../../lib/VideoConfManager';

export const useUpdateVideoConfUser = () => {
	const userId = useUserId();
	const { connected, isLoggingIn } = useConnectionStatus();

	useEffect(() => {
		VideoConfManager.updateUser(userId, isLoggingIn, connected);
	}, [userId, isLoggingIn, connected]);
};
