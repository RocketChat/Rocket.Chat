import type { MediaSignalHeader } from './MediaSignalHeader';

export type RequestOfferBody = {
	request: 'offer';
	iceRestart?: boolean;
};

export type RequestAnswerBody = {
	request: 'answer';
	offer: RTCSessionDescriptionInit;
};

export type RequestSdpBody = {
	request: 'sdp';
};

export type RequestBodyMap = {
	offer: RequestOfferBody;
	answer: RequestAnswerBody;
	sdp: RequestSdpBody;
};

export type RequestBody<T extends keyof RequestBodyMap> = RequestBodyMap[T];

export type MediaSignalRequest<T extends keyof RequestBodyMap = keyof RequestBodyMap> = MediaSignalHeader & {
	type: 'request';
	body: RequestBody<T>;
};

export type RequestParams<T extends keyof RequestBodyMap = keyof RequestBodyMap> = Omit<RequestBody<T>, 'request'>;
