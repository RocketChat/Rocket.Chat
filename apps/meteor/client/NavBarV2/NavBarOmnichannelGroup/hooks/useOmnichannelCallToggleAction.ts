import type { Keys as IconName } from '@rocket.chat/icons';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
	useIsCallReady,
	useIsCallError,
	useCallerInfo,
	useCallRegisterClient,
	useCallUnregisterClient,
	useVoipNetworkStatus,
} from '../../../contexts/CallContext';

export const useOmnichannelCallToggleAction = () => {
	const { t } = useTranslation();
	const isCallReady = useIsCallReady();
	const isCallError = useIsCallError();

	const caller = useCallerInfo();
	const unregister = useCallUnregisterClient();
	const register = useCallRegisterClient();

	const networkStatus = useVoipNetworkStatus();
	const registered = !['ERROR', 'INITIAL', 'UNREGISTERED'].includes(caller.state);
	const inCall = ['IN_CALL'].includes(caller.state);

	const handleToggleCall = useCallback(() => {
		if (registered) {
			unregister();
			return;
		}
		register();
	}, [registered, register, unregister]);

	const title = useMemo(() => {
		if (isCallError) {
			return t('Error');
		}

		if (!isCallReady) {
			return t('Loading');
		}

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
	}, [inCall, isCallError, isCallReady, networkStatus, registered, t]);

	const icon: IconName = useMemo(() => {
		if (networkStatus === 'offline') {
			return 'phone-issue';
		}
		return registered ? 'phone' : 'phone-disabled';
	}, [networkStatus, registered]);

	return {
		handleToggleCall,
		title,
		icon,
		isDisabled: inCall || isCallError || !isCallReady,
		isDanger: isCallError,
		isSuccess: registered,
		isWarning: networkStatus === 'offline',
	};
};
