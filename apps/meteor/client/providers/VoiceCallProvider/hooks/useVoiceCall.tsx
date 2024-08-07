import { useContext, useMemo } from 'react';

import VoiceCallContext from '../../../contexts/VoiceCallContext';
import useVoiceCallAPI from './useVoiceCallAPI';
import useVoiceCallSession from './useVoiceCallSession';
import useVoiceCallState from './useVoiceCallState';

export const useVoiceCall = () => {
	const { error } = useContext(VoiceCallContext);
	const state = useVoiceCallState();
	const session = useVoiceCallSession();
	const api = useVoiceCallAPI();

	return useMemo(
		() => ({
			...state,
			...api,
			session,
			error,
		}),
		[state, api, session, error],
	);
};

export default useVoiceCall;
