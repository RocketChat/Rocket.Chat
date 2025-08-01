import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { DeepPartial } from '../utils';
import type {
	IFreeSwitchChannelEventHeader,
	IFreeSwitchChannelEventMutable,
	IFreeSwitchChannelEventStates,
} from './IFreeSwitchChannelEvent';

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

export interface IFreeSwitchChannelEventDelta extends IRocketChatRecord, IFreeSwitchChannelEventDeltaData, IFreeSwitchChannelEventStates {
	channelUniqueId: string;
}
