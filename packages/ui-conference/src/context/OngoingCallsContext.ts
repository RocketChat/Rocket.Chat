import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { createContext, useContext } from 'react';

/**
 * Where one call's ring stands *on this client*, and how to stop it.
 *
 * Deliberately not a property of the call: the same ring can be sounding here, already answered on another of
 * this user's sessions, and never heard at all by a third — so it is asked per call rather than handed over as
 * a list for each row to search itself.
 */
export type CallRing = {
	/** Making noise here, right now — which is the only case where there is anything to silence. */
	audible: boolean;
	/** Hushed here, which is a different thing from never having rung: the row says so rather than going quiet. */
	silenced: boolean;
	/** Stops the noise on this client. */
	silence: () => void;
};

/**
 * The calls this user could walk into right now, already bucketed by what each of them is doing.
 *
 * Bucketing happens outside this package because "still ringing" is an answer with a clock in it, and the clock
 * belongs with whoever is watching the list rather than with each row that draws one.
 */
export type OngoingCallsContextValue = {
	/** Rung and not yet answered for. */
	ringing: JoinableVideoConference[];
	/** Running, or already joined — either way, there to be walked into. */
	ongoing: JoinableVideoConference[];
	/** Turned down, and keeping a place in the list as the way back in. */
	declined: JoinableVideoConference[];
	joinCall: (callId: string) => void;
	declineCall: (callId: string) => void;
	/** How this client stands with one call's ring. Which calls are audible is the application's to know. */
	callRing: (callId: string) => CallRing;
	/**
	 * Where a call lives, so a row can be a real link — openable in a tab of its own, and nameable. Routes are the
	 * application's to know.
	 */
	callHref: (callId: string) => string;
	/**
	 * When a call happened, said the way the rest of the product says it. How a workspace writes a time is a
	 * setting and a preference, neither of which a row has any business reading.
	 */
	formatTime: (date: Date) => string;
};

export const defaultOngoingCallsContextValue: OngoingCallsContextValue = {
	ringing: [],
	ongoing: [],
	declined: [],
	joinCall: () => undefined,
	declineCall: () => undefined,
	callRing: () => ({ audible: false, silenced: false, silence: () => undefined }),
	callHref: (callId) => `/conference/${callId}`,
	formatTime: (date) => date.toISOString(),
};

export const OngoingCallsContext = createContext<OngoingCallsContextValue>(defaultOngoingCallsContextValue);

export const useOngoingCalls = (): OngoingCallsContextValue => useContext(OngoingCallsContext);
