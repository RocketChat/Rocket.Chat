import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { DeepPartial } from '../utils';
import type { IFreeSwitchChannelEvent } from './IFreeSwitchChannelEvent';

export interface IFreeSwitchChannel extends IRocketChatRecord {
	uniqueId: string;
	channelName: string;

	freeSwitchUser: string;

	rocketChatUser?: string;
	rocketChatHostname?: string;

	// type: string;
	// context?: string;
	// sipProfile?: string;

	// originator?: string;
	// originatees?: string[];
	// bridgedTo?: string;

	// isVoicemail?: boolean;
	// reached?: boolean;

	events: DeepPartial<Omit<IFreeSwitchChannelEvent, '_id' | '_updatedAt' | 'channelUniqueId'>>[];
	// calls: IFreeSwitchChannelCall[];
}

export interface IFreeSwitchChannelCall {
	UUID?: string;
	answerState?: string;
	state?: string;
	previousState?: string;
	sipId?: string;
	authorized?: string;
	hangupCause?: string;
	duration?: number;
	direction?: string;
}
