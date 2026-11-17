import { createContext, useContext } from 'react';

/** Stops the sound it was returned for; absent when there was nothing to play. */
type StopSound = (() => void) | undefined;

export type CallSoundsContextValue = {
	playRinger: () => StopSound;
	playDialer: () => StopSound;
	stopRinger: () => void;
	stopDialer: () => void;
};

export const defaultCallSoundsContextValue: CallSoundsContextValue = {
	playRinger: () => undefined,
	playDialer: () => undefined,
	stopRinger: () => undefined,
	stopDialer: () => undefined,
};

export const CallSoundsContext = createContext<CallSoundsContextValue>(defaultCallSoundsContextValue);

export const useCallSounds = (): CallSoundsContextValue => useContext(CallSoundsContext);
