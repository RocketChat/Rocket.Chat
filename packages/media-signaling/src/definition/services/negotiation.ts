import type { IClientMediaCall } from '../call';
import type { IMediaSignalLogger } from '../logger';

export type NegotiationManagerEvents = {
	'error': { errorCode: string; negotiationId: string };
	'local-sdp': { negotiationId: string; sdp: RTCSessionDescriptionInit };
	'negotiation-needed': { oldNegotiationId: string };
};

export type NegotiationManagerConfig = {
	logger?: IMediaSignalLogger | null;
};

export type NegotiationEvents = {
	'error': { errorCode: string };
	'ended': void;
	'local-sdp': { sdp: RTCSessionDescriptionInit };
};

export type NegotiationData = {
	negotiationId: string;
	sequence: number;
	isPolite: boolean;

	remoteOffer: RTCSessionDescriptionInit | null;
};

export interface INegotiationCompatibleMediaCall extends IClientMediaCall {
	hasInputTrack(): boolean;
}
