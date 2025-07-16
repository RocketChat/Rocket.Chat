import { useContext, useMemo } from 'react';

import { useVoipEffect } from './useVoipEffect';
import { VoipContext } from '../contexts/VoipContext';

export type VoipState = {
	isEnabled: boolean;
	isRegistered: boolean;
	isReady: boolean;
	isOnline: boolean;
	isIncoming: boolean;
	isOngoing: boolean;
	isOutgoing: boolean;
	isInCall: boolean;
	isError: boolean;
	error?: Error | null;
	clientError?: Error | null;
	isReconnecting: boolean;
};

const DEFAULT_STATE = {
	isRegistered: false,
	isReady: false,
	isInCall: false,
	isOnline: false,
	isIncoming: false,
	isOngoing: false,
	isOutgoing: false,
	isError: false,
	isReconnecting: false,
};

export const useVoipState = (): VoipState => {
	const { isEnabled, error: clientError } = useContext(VoipContext);

	const callState = useVoipEffect((client) => client.getState(), DEFAULT_STATE);

	return useMemo(
		() => ({
			...callState,
			clientError,
			isEnabled,
			isError: !!clientError || callState.isError,
		}),
		[clientError, isEnabled, callState],
	);
};
