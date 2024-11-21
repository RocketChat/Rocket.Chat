import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IUser } from '../IUser';

export interface IFreeSwitchChannelEvent {
	eventName: string;
	state?: string;

	data: Record<string, string>;
}

export interface IFreeSwitchChannelUser {
	extension?: string;
	context?: string;
	user?: Pick<Required<IUser>, '_id' | 'username' | 'name' | 'avatarETag'>;
	identifiers: string[];
}

export interface IFreeSwitchChannel extends IRocketChatRecord {
	uniqueId: string;
	lastEventName: string;
	channelState: string;
	createdAt?: Date;
	endedAt?: Date;

	referencedIds?: string[];

	events: IFreeSwitchChannelEvent[];

	answerState?: string;
	hangupCause?: string;
	direction?: string;
	duration?: number;
	destroyed?: boolean;

	outgoing?: boolean;
	placedOnHold?: boolean;
	parked?: boolean;
	bridged?: boolean;
	answered?: boolean;
}
