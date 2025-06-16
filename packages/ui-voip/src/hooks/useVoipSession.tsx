import type { VoipSession } from '../definitions';
import { useVoipEffect } from './useVoipEffect';

export const useVoipSession = (): VoipSession | null => {
	return useVoipEffect((client) => client.getSession(), null);
};
