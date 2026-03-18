import type {
	AtLeast,
	IUser,
	MediaCallActorType,
	MediaCallContact,
	MediaCallSignedContact,
	MediaCallKind,
	IDirectMediaCall,
	IConferenceMediaCall,
} from '@rocket.chat/core-typings';
import type { CallFeature, CallRejectedReason, CallService } from '@rocket.chat/media-signaling';

export type MinimalUserData = Pick<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'>;

export type GetActorContactOptions = {
	requiredType?: MediaCallActorType;
	preferredType?: MediaCallActorType;
};

export type BaseCallParams = {
	kind: MediaCallKind;
	caller: MediaCallSignedContact;
	requestedCallId?: string;
	requestedService?: CallService;
	parentCallId?: string;
	requestedBy?: MediaCallSignedContact;
	features: CallFeature[];
};

export type DirectCallParams = BaseCallParams & {
	kind: 'direct';
	callee: MediaCallContact;
	conferenceId?: IConferenceMediaCall['_id'];
};

export type ConferenceCallParams = BaseCallParams & {
	kind: 'conference';
	callees: MediaCallContact[];
};

export type InternalCallParams = DirectCallParams | ConferenceCallParams;

export type MediaCallHeader =
	| AtLeast<IDirectMediaCall, '_id' | 'caller' | 'callee' | 'kind'>
	| AtLeast<IConferenceMediaCall, '_id' | 'caller' | 'callees' | 'kind'>;

export class CallRejectedError extends Error {
	constructor(
		public readonly callRejectedReason: CallRejectedReason,
		message?: string,
	) {
		super(message || 'call-rejected');
	}
}
