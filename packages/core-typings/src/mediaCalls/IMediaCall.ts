import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IUser } from '../IUser';

export type MediaCallActor =
	| {
			type: 'user';
			id: IUser['_id'];
			sessionId?: string;
	  }
	| {
			type: 'sip';
			id: string;
	  }
	| {
			type: 'server';
			id: 'server';
	  };

export type MediaCallContactInformation = {
	displayName?: string;
	username?: string;
	sipExtension?: string;
};

export type MediaCallContact = MediaCallActor & MediaCallContactInformation;

export interface IMediaCall extends IRocketChatRecord {
	service: 'webrtc';
	kind: 'direct';

	rid?: string;
	state: 'none' | 'ringing' | 'accepted' | 'active' | 'hangup';

	createdBy: MediaCallActor;
	createdAt: Date;

	caller: MediaCallContact;
	callee: MediaCallContact;

	endedBy?: MediaCallActor;
	endedAt?: Date;

	sequence: number;

	// providerName: string;
	// providerData?: Record<string, any>;
}
