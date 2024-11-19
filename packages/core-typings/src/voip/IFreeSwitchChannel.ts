import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { VideoConference } from '../IVideoConference';

export interface IFreeSwitchChannelEvent {
	eventName: string;

	data: Record<string, string>;
}

export interface IFreeSwitchChannel extends IRocketChatRecord {
	lastEventName: string;
	channelState: string;

	uniqueId: string;
	otherLegUniqueId?: string;
	caller?: {
		username?: string;
		context?: string;
	};

	events: IFreeSwitchChannelEvent[];

	callId?: VideoConference['_id'];
}
