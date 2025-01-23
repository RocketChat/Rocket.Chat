import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IUser } from '../IUser';
import type { IFreeSwitchEventCall, IFreeSwitchEventCallUser, IFreeSwitchEventChannel } from './IFreeSwitchEvent';

export interface IFreeSwitchCall extends IRocketChatRecord {
	UUID: string;
	channels: IFreeSwitchEventChannel[];
	events: IFreeSwitchCallEvent[];
	from?: Pick<IUser, '_id' | 'username' | 'name' | 'avatarETag' | 'freeSwitchExtension'>;
	to?: Pick<IUser, '_id' | 'username' | 'name' | 'avatarETag' | 'freeSwitchExtension'>;
	forwardedFrom?: Omit<IFreeSwitchCall, 'events'>[];
	direction?: 'internal' | 'external_inbound' | 'external_outbound';
	voicemail?: boolean;
	duration?: number;
	startedAt?: Date;

	workspaces?: string[];
	users?: IFreeSwitchEventCallUser[];
}

const knownEventTypes = [
	'NEW',
	'INIT',
	'CREATE',
	'DESTROY',
	'ANSWER',
	'HANGUP',
	'BRIDGE',
	'UNBRIDGE',
	'OUTGOING',
	'PARK',
	'UNPARK',
	'HOLD',
	'UNHOLD',
	'ORIGINATE',
	'UUID',
	'REPORTING',
	'ROUTING',
	'RINGING',
	'ACTIVE',
	'EARLY',
	'RING_WAIT',
	'EXECUTE',
	'CONSUME_MEDIA',
	'EXCHANGE_MEDIA',
	'OTHER',
	'OTHER_STATE',
	'OTHER_CALL_STATE',
] as const;

export type IFreeSwitchCallEventType = (typeof knownEventTypes)[number];

export const isKnownFreeSwitchEventType = (eventName: string): eventName is IFreeSwitchCallEventType =>
	knownEventTypes.includes(eventName as any);

export type IFreeSwitchCallEvent = {
	eventName: string;
	type: IFreeSwitchCallEventType;
	sequence?: string;
	channelUniqueId?: string;
	timestamp?: string;
	firedAt?: Date;
	channel?: IFreeSwitchEventChannel;
	caller?: IFreeSwitchEventCallUser;
	callee?: IFreeSwitchEventCallUser;
	call?: IFreeSwitchEventCall;

	workspaces?: string[];

	raw?: Record<string, string>;
	eventId: string;
	extraEvents?: IFreeSwitchCallEvent[];
};
