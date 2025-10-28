import type { IRocketChatRecord } from '../IRocketChatRecord';
import type {
	FreeSwitchChannelEventHeaderWithStates,
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

	profiles: IFreeSwitchChannelProfile[];

	startedAt: Date;
	anyMedia: boolean;
	anyAnswer: boolean;
	anyBridge: boolean;
	durationSum: number;
	totalDuration: number;

	kind: 'internal' | 'external' | 'voicemail' | 'unknown';

	finalState: IFreeSwitchChannelEventMutable;
	events: FreeSwitchChannelEventHeaderWithStates[];
}

export interface IFreeSwitchChannelProfile extends IFreeSwitchChannelEventLegProfile {
	// This value is pulled from the next profile
	nextProfileCreatedTime?: Date;

	callDuration?: number;
	answered?: boolean;
	media?: boolean;
	bridged?: boolean;
}
