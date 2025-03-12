import { useEffect } from 'react';

import { VideoConfManager } from '../../../lib/VideoConfManager';

export const useUpdateVideoConfUser = () => {
	const [userId, isLoggingIn, isConnected] = [Meteor.userId(), Meteor.loggingIn(), Meteor.status().connected];

	useEffect(() => {
		console.log('[VideoConf] useUpdateVideoConfUser hook called with:', {
			userId,
			isLoggingIn,
			isConnected,
		});

		VideoConfManager.updateUser(userId, isLoggingIn, isConnected);
	}, [userId, isLoggingIn, isConnected]);
};
