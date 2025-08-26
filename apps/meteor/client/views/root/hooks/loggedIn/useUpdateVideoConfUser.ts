import { useConnectionStatus, useIsLoggingIn } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { VideoConfManager } from '../../../../lib/VideoConfManager';

export const useUpdateVideoConfUser = (userId: string) => {
	const { connected } = useConnectionStatus();
	const isLoggingIn = useIsLoggingIn();

	useEffect(() => {
		VideoConfManager.updateUser(userId, isLoggingIn, connected);
	}, [userId, isLoggingIn, connected]);
};
