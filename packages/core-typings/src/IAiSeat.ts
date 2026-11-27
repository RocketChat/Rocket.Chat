import type { IAiAgent } from './IAiAgent';
import type { IAiEngine } from './IAiEngine';
import type { IRocketChatRecord } from './IRocketChatRecord';
import type { IRoom } from './IRoom';
import type { IUser } from './IUser';

export type AiSeatState = 'registered' | 'claimed' | 'retired';

/**
 * A seat an operator registered for an engine: the only source of the seat's bot, rooms, tools and routes for any
 * privileged write. It moves from `registered` to `claimed` once, and `retired` is final.
 */
export interface IAiSeat extends IRocketChatRecord {
	engineId: IAiEngine['_id'];
	seatId: string;
	botUserId: IUser['_id'];
	allowedRoomIds: IRoom['_id'][];
	allowedToolIds: string[];
	allowedRouteIds: string[];
	registeredBy: IUser['_id'];
	registeredAt: Date;
	state: AiSeatState;
	agentId?: IAiAgent['_id'];
	claimedAt?: Date;
	retiredBy?: IUser['_id'];
	retiredAt?: Date;
}
