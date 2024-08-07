import { useContext, useMemo } from 'react';

import { VoiceCallContext } from '../../contexts/VoiceCallContext';
import useVoiceCallEffect from './useVoiceCallEffect';

export type VoiceCallState = {
	isEnabled: boolean;
	isRegistered: boolean;
	isReady: boolean;
	isInCall: boolean;
	isOnline: boolean;
	isError: boolean;
	error?: Error | null;
};

const DEFAULT_STATE = {
	isRegistered: false,
	isReady: false,
	isInCall: false,
	isOnline: false,
};

export const useVoiceCallState = (): VoiceCallState => {
	const { isEnabled, error } = useContext(VoiceCallContext);

	const clientState = useVoiceCallEffect((client) => client.getState(), DEFAULT_STATE);

	return useMemo(
		() => ({
			error,
			isEnabled,
			isError: !!error,
			...clientState,
		}),
		[error, isEnabled, clientState],
	);
};

export default useVoiceCallState;
