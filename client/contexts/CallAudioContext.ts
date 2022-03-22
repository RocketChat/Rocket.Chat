import { createContext, useContext } from 'react';

type CallAudioContextValue = {
	value: React.RefObject<HTMLAudioElement> | null;
};

const CallAudioContextDefault: CallAudioContextValue = {
	value: null,
};

export const CallAudioContext = createContext<CallAudioContextValue>(CallAudioContextDefault);

export const useCallAudioMediaRef = (): React.RefObject<HTMLAudioElement> | null => {
	const { value } = useContext(CallAudioContext);
	return value;
};
