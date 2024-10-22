import { useContext, useMemo } from 'react';

import { VoipContext } from '../contexts/VoipContext';
import { useVoipAPI } from './useVoipAPI';
import { useVoipSession } from './useVoipSession';
import { useVoipState } from './useVoipState';

export const useVoip = () => {
	const { error } = useContext(VoipContext);
	const state = useVoipState();
	const session = useVoipSession();
	const api = useVoipAPI();

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
