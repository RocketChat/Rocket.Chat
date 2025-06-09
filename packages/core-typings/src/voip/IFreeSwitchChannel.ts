import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { DeepPartial } from '../utils';
import type { IFreeSwitchChannelEventParsedMutable, IFreeSwitchChannelEventDelta } from './IFreeSwitchChannelEvent';

export interface IFreeSwitchChannel extends IRocketChatRecord {
	uniqueId: string;
	name: string;

	freeSwitchUser?: string;

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

	// events: DeepPartial<Omit<IFreeSwitchChannelEvent, '_id' | '_updatedAt' | 'channelUniqueId'>>[];
	events: Record<number, DeepPartial<IFreeSwitchChannelEventDelta>>;

	finalState: IFreeSwitchChannelEventParsedMutable;

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
