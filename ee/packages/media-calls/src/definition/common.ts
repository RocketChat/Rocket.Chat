import type { AtLeast, IMediaCall, IUser, MediaCallActorType, MediaCallContact, MediaCallSignedContact } from '@rocket.chat/core-typings';
import type { CallFeature, CallRejectedReason, CallService } from '@rocket.chat/media-signaling';

export type MinimalUserData = Pick<IUser, '_id' | 'username' | 'name' | 'freeSwitchExtension'>;

export type GetActorContactOptions = {
	requiredType?: MediaCallActorType;
	preferredType?: MediaCallActorType;
};

export type InternalCallParams = {
	caller: MediaCallSignedContact;
	callee: MediaCallContact;
	requestedCallId?: string;
	requestedService?: CallService;
	parentCallId?: string;
	requestedBy?: MediaCallSignedContact;
	features?: CallFeature[];
};

export type MediaCallHeader = AtLeast<IMediaCall, '_id' | 'caller' | 'callee'>;

export class CallRejectedError extends Error {
	constructor(
		public readonly callRejectedReason: CallRejectedReason,
		message?: string,
	) {
		super(message || 'call-rejected');
	}
}

export type SignalProcessingOptions = {
	// Some signals can be safely skipped when they are not relevant to the current call state, but
	// if the signal was received via REST, we shouldn't return success without processing anything, so we throw an error instead
	throwIfSkipped?: boolean;
};
