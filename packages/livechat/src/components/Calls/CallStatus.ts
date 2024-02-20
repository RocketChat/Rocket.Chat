export const enum CallStatus {
	RINGING = 'ringing',
	DECLINED = 'declined',
	IN_PROGRESS = 'inProgress', // although on Livechat we only use "IN_PROGRESS_SAME_TAB" and "IN_PROGRESS_DIFFERENT_TAB", we still need this status since on Rocket.Chat core, this is the status of ongoing calls
	IN_PROGRESS_SAME_TAB = 'inProgressSameTab',
	IN_PROGRESS_DIFFERENT_TAB = 'inProgressDifferentTab',
	ENDED = 'ended',
}

export const isCallOngoing = (callStatus: CallStatus) =>
	callStatus === CallStatus.IN_PROGRESS ||
	callStatus === CallStatus.IN_PROGRESS_DIFFERENT_TAB ||
	callStatus === CallStatus.IN_PROGRESS_SAME_TAB;

interface IncomingCallAlert {
	show?: boolean;
	callProvider?: string;
	callerUsername?: string;
	rid?: string;
	time?: { time: number };
	callId?: string;
	url?: string;
}
interface OngoingCall {
	callStatus: CallStatus;
	time?: { time: number };
}

declare module '../../store' {
	export interface StoreState {
		ongoingCall?: OngoingCall;
		incomingCallAlert?: IncomingCallAlert;
	}
}
