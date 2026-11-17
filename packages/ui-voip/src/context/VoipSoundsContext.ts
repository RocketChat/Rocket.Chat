import { createContext, useContext } from 'react';

/** Stops the sound it was returned for; absent when there was nothing to play. */
type StopSound = (() => void) | undefined;

export type VoipSoundsContextValue = {
	playRinger: () => StopSound;
	playDialer: () => StopSound;
	playCallEnded: () => StopSound;
	stopRinger: () => void;
	stopDialer: () => void;
	stopCallEnded: () => void;
	stopAll: () => void;
};

export const VoipSoundsContext = createContext<VoipSoundsContextValue>({
	playRinger: () => undefined,
	playDialer: () => undefined,
	playCallEnded: () => undefined,
	stopRinger: () => undefined,
	stopDialer: () => undefined,
	stopCallEnded: () => undefined,
	stopAll: () => undefined,
});

export const useVoipSounds = (): VoipSoundsContextValue => useContext(VoipSoundsContext);
