import type { MediaSignalHeader } from './MediaSignalHeader';

export type DeliverSdpBody = {
	deliver: 'sdp';
	sdp: RTCSessionDescriptionInit;
	endOfCandidates: boolean;
};

export type DeliverIceCandidatesBody = {
	deliver: 'ice-candidates';
	candidates: RTCIceCandidateInit[];
	endOfCandidates: boolean;
};

export type DeliverDTMFBody = {
	deliver: 'dtmf';
	tone: string;
	duration?: number;
};

export type DeliverBodyMap = {
	'sdp': DeliverSdpBody;
	'ice-candidates': DeliverIceCandidatesBody;
	'dtmf': DeliverDTMFBody;
};

export type DeliverType = keyof DeliverBodyMap;

export type DeliverBody<T extends DeliverType> = DeliverBodyMap[T];

export type MediaSignalDeliver<T extends DeliverType = DeliverType> = MediaSignalHeader & {
	type: 'deliver';
	body: DeliverBody<T>;
};

export type DeliverParams<T extends DeliverType = DeliverType> = Omit<DeliverBody<T>, 'deliver'>;
