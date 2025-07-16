import { useConnectionStatus } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { VideoConfManager } from '../../../lib/VideoConfManager';

export const useUpdateVideoConfUser = (userId: string) => {
	const { connected, isLoggingIn } = useConnectionStatus();

	useEffect(() => {
		VideoConfManager.updateUser(userId, isLoggingIn, connected);
	}, [userId, isLoggingIn, connected]);
};
