import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { DeepPartial } from '../utils';
import type { IFreeSwitchChannelEventHeader, IFreeSwitchChannelEventMutable } from './IFreeSwitchChannelEvent';

type DeepModified<T> = {
	[P in keyof T]?: T[P] extends Date | undefined
		? { oldValue: T[P]; newValue: T[P]; delta: number } | undefined
		: T[P] extends object | undefined
			? DeepModified<T[P]>
			: { oldValue: T[P]; newValue: T[P] } | undefined;
};

export interface IFreeSwitchChannelEventDeltaData extends IFreeSwitchChannelEventHeader {
	newValues?: DeepPartial<IFreeSwitchChannelEventMutable>;
	modifiedValues?: DeepModified<IFreeSwitchChannelEventMutable>;
}

export interface IFreeSwitchChannelEventDelta extends IRocketChatRecord {
	channelUniqueId: string;

	// document will have either 'event' or 'finalState' depending on this field
	isFinalState: boolean;

	// The changes to values of one specific event
	event?: IFreeSwitchChannelEventDeltaData;

	// Final state for the channel, combining all of its events
	finalState?: IFreeSwitchChannelEventMutable;
}
