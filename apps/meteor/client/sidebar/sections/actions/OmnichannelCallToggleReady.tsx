import { Sidebar } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import {
	useCallRegisterClient,
	useCallUnregisterClient,
	useCallerInfo,
	useVoipNetworkStatus,
} from '../../../contexts/OmnichannelCallContext';

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
			return t('Waiting_for_server_connection');
		}

		if (inCall) {
			return t('Cannot_disable_while_on_call');
		}

		if (registered) {
			return t('Turn_off_answer_calls');
		}

		return t('Turn_on_answer_calls');
	};

	const getIcon = (): 'phone-issue' | 'phone' | 'phone-disabled' => {
		if (networkStatus === 'offline') {
			return 'phone-issue';
		}
		return registered ? 'phone' : 'phone-disabled';
	};

	return (
		<Sidebar.TopBar.Action
			icon={getIcon()}
			disabled={inCall}
			aria-checked={registered}
			aria-label={t('VoIP_Toggle')}
			data-tooltip={getTitle()}
			{...props}
			success={registered}
			warning={networkStatus === 'offline'}
			onClick={onClickVoipButton}
		/>
	);
};
