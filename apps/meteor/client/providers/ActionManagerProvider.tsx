import { useUserId } from '@rocket.chat/ui-contexts';
import type { ReactNode, ReactElement } from 'react';
import React, { useEffect } from 'react';

import { Notifications } from '../../app/notifications/client';
import * as ActionManager from '../../app/ui-message/client/ActionManager';
import { ActionManagerContext } from '../contexts/ActionManagerContext';

type ActionManagerProviderProps = {
	children?: ReactNode;
};

const ActionManagerProvider = ({ children }: ActionManagerProviderProps): ReactElement => {
	const uid = useUserId();
	useEffect(() => {
		if (!uid) {
			return;
		}

		Notifications.onUser('uiInteraction', ({ type, ...data }) => {
			ActionManager.handlePayloadUserInteraction(type, data);
		});

		return () => {
			Notifications.unUser('uiInteraction');
		};
	});

	return <ActionManagerContext.Provider value={ActionManager}>{children}</ActionManagerContext.Provider>;
};

export default ActionManagerProvider;
