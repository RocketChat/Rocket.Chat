import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useCallback } from 'react';

import { useCallerInfo, useCallRegisterClient, useCallUnregisterClient, useVoipNetworkStatus } from '../../../contexts/CallContext';

export const OmnichannelCallToggleReady = ({ ...props }): ReactElement => {
	const t = useTranslation();

	const caller = useCallerInfo();
	const unregister = useCallUnregisterClient();
	const register = useCallRegisterClient();

	const networkStatus = useVoipNetworkStatus();
	const registered = !['ERROR', 'INITIAL', 'UNREGISTERED'].includes(caller.state);
	const inCall = ['IN_CALL'].includes(caller.state);

	const onClickVoipButton = useCallback((): void => {
		if (registered) {
			unregister();
			return;
		}
		register();
	}, [registered, register, unregister]);

	const getTitle = (): string => {
		if (networkStatus === 'offline') {
			return t('Signaling_connection_disconnected');
		}

		if (inCall) {
			return t('Cannot_disable_while_on_call');
		}

		if (registered) {
			return t('Enabled');
		}

		return t('Disabled');
	};

	const getIcon = (): 'phone-issue' | 'phone' | 'phone-disabled' => {
		if (networkStatus === 'offline') {
			return 'phone-issue';
		}
		return registered ? 'phone' : 'phone-disabled';
	};

	const getColor = (): 'warning' | 'success' | undefined => {
		if (networkStatus === 'offline') {
			return 'warning';
		}
		return registered ? 'success' : undefined;
	};

	const voipCallIcon = {
		title: getTitle(),
		icon: getIcon(),
		color: getColor(),
	};

	return <Sidebar.TopBar.Action disabled={inCall} {...voipCallIcon} {...props} onClick={onClickVoipButton} />;
};
