import { type MediaSignalHeader } from './MediaSignalHeader';

export type NotifyAckBody = {
	notify: 'ack';
};

// export type NotifyInvalidBody = {
// 	notify: 'invalid';
// };

// export type NotifyUnableBody = {
// 	notify: 'unable';
// };

// export type NotifyEmptyBody = {
// 	notify: 'empty';
// };

export type NotifyErrorBody = {
	notify: 'error';
	errorCode: string;
	errorText?: string;
};

export type NotifyNewBody = {
	notify: 'new';
	service: 'webrtc';
	kind: 'direct';
};

export type NotifyStateBody = {
	notify: 'state';
	callState?: string;
	serviceState?: string;
	mediaState?: string;
};

export type NotifyUnavailableBody = {
	notify: 'unavailable';
};

export type NotifyAcceptBody = {
	notify: 'accept';
};

export type NotifyRejectBody = {
	notify: 'reject';
};

export type NotifyHangupBody = {
	notify: 'hangup';
	reasonCode: string;
	reasonText?: string;
};

export type NotifyNegotiationNeededBody = {
	notify: 'negotiation-needed';
	reason?: string;
};

export type NotifyBodyMap = {
	'new': NotifyNewBody;
	'ack': NotifyAckBody;
	// 'invalid': NotifyInvalidBody;
	// 'unable': NotifyUnableBody;
	// 'empty': NotifyEmptyBody;
	'error': NotifyErrorBody;
	'accept': NotifyAcceptBody;
	'reject': NotifyRejectBody;
	'hangup': NotifyHangupBody;
	'negotiation-needed': NotifyNegotiationNeededBody;
	'unavailable': NotifyUnavailableBody;
	'state': NotifyStateBody;
};

export type NotifyType = keyof NotifyBodyMap;

export type NotifyBody<T extends NotifyType = NotifyType> = NotifyBodyMap[T];

export type MediaSignalNotify<T extends NotifyType = NotifyType> = MediaSignalHeader & {
	type: 'notify';
	body: NotifyBody<T>;
};

export type NotifyParams<T extends NotifyType = NotifyType> = Omit<NotifyBody<T>, 'notify'>;
