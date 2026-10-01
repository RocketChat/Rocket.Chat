import { useEmbeddedLayout } from '@rocket.chat/ui-client';
import { useConnectionStatus, useIsLoggingIn, useVideoconfPermissions } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { VideoConfManager } from '../../../../lib/VideoConfManager';

export const useUpdateVideoConfUser = (userId: string) => {
	const { connected } = useConnectionStatus();
	const isLoggingIn = useIsLoggingIn();
	const embeddedLayout = useEmbeddedLayout();
	const { canJoinConference } = useVideoconfPermissions();

	useEffect(() => {
		// Videconf should not be available in embedded layout, nor to users without access to it
		VideoConfManager.updateUser(embeddedLayout || !canJoinConference ? null : userId, isLoggingIn, connected);
	}, [userId, isLoggingIn, connected, embeddedLayout, canJoinConference]);
};
