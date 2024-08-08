import type { VoiceCallSession } from '../../contexts/VoiceCallContext';
import useVoiceCallEffect from './useVoiceCallEffect';

export const useVoiceCallSession = (): VoiceCallSession | null => {
	return useVoiceCallEffect((client) => client.getSession(), null);
};

export default useVoiceCallSession;
