import { useEffect } from 'react';

import { VideoConfManager } from '../../../lib/VideoConfManager';

export const useUpdateVideoConfUser = () => {
	const userId = Meteor.userId();
	const isLoggingIn = Meteor.loggingIn();
	const isConnected = Meteor.status().connected;

	useEffect(() => {
		VideoConfManager.updateUser();
	}, [userId, isLoggingIn, isConnected]);
};
