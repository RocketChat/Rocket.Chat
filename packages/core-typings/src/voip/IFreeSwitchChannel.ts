import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { DeepPartial } from '../utils';
import type {
	IFreeSwitchChannelEventHeader,
	IFreeSwitchChannelEventLegProfile,
	IFreeSwitchChannelEventMutable,
} from './IFreeSwitchChannelEvent';

export interface IFreeSwitchChannel extends IRocketChatRecord {
	uniqueId: string;
	name: string;

	freeSwitchUser?: string;
	callers?: string[];
	callees?: string[];
	bridgedTo: string[];
	callDirection?: string;

	events: Record<number, DeepPartial<IFreeSwitchChannelEventDelta>>;
	profiles: Record<string, IFreeSwitchChannelProfile>;

	finalState: IFreeSwitchChannelEventMutable;
}

export interface IFreeSwitchChannelProfile extends IFreeSwitchChannelEventLegProfile {
	// This value is pulled from the next profile
	nextProfileCreatedTime?: Date;
}

export type DeepModified<T> = {
	[P in keyof T]?: T[P] extends Date | undefined
		? { oldValue: T[P]; newValue: T[P]; delta: number } | undefined
		: T[P] extends object | undefined
			? DeepModified<T[P]>
			: { oldValue: T[P]; newValue: T[P] } | undefined;
};

export interface IFreeSwitchChannelEventDelta extends IFreeSwitchChannelEventHeader {
	newValues?: DeepPartial<IFreeSwitchChannelEventMutable>;
	modifiedValues?: DeepModified<IFreeSwitchChannelEventMutable>;
}
