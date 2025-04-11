import { useConnectionStatus, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import { useCallback } from 'react';

import { useIdleDetection } from './useIdleDetection';

export const useLoginPresence = () => {
	const uid = useUserId();
	const { status } = useConnectionStatus();
	const allowAnonymousRead = useSetting('Accounts_AllowAnonymousRead');

	const disconnect = useCallback(() => {
		if (status === 'offline') {
			if (!uid && allowAnonymousRead !== true) {
				Meteor.disconnect();
				return;
			}
			Meteor.reconnect();
		}
	}, [allowAnonymousRead, status, uid]);

	useIdleDetection(disconnect, { time: 3000 });
};
