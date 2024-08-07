import { useContext, useMemo } from 'react';

import { VoiceCallContext } from '../../../contexts/VoiceCallContext';
import useVoiceCallEffect from './useVoiceCallEffect';

export type VoiceCallState = {
	isEnabled: boolean;
	isRegistered: boolean;
	isReady: boolean;
	isOnline: boolean;
	isIncoming: boolean;
	isOngoing: boolean;
	isOutgoing: boolean;
	isError: boolean;
	error?: Error | null;
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
};

export const useVoiceCallState = (): VoiceCallState => {
	const { isEnabled, error: clientError } = useContext(VoiceCallContext);

	const callState = useVoiceCallEffect((client) => client.getState(), DEFAULT_STATE);

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

export default useVoiceCallState;
