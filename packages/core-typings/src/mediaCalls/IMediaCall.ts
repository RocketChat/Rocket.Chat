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

export interface IMediaCall extends IRocketChatRecord {
	service: 'webrtc';
	kind: 'direct';

	rid?: string;
	state: 'none' | 'ringing' | 'accepted' | 'active' | 'hangup';

	createdBy: MediaCallActor;
	createdAt: Date;

	caller: MediaCallActor;
	callee: MediaCallActor;

	endedBy?: MediaCallActor;
	endedAt?: Date;

	// providerName: string;
	// providerData?: Record<string, any>;
}
