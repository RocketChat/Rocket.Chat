import type { WithoutProjection, FindOneOptions, WriteOpResult, Cursor } from 'mongodb';
import type { IVoipRoom, IRoomClosingInfo } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IVoipRoomModel extends IBaseModel<IVoipRoom> {
	findOneOpenByVisitorToken(visitorToken: string, options?: FindOneOptions<IVoipRoom>): Promise<IVoipRoom | null>;
	findOpenByAgentId(agentId: string): Cursor<IVoipRoom>;
	findOneByAgentId(agentId: string): Promise<IVoipRoom | null>;

	findOneVoipRoomById(id: string, options?: WithoutProjection<FindOneOptions<IVoipRoom>>): Promise<IVoipRoom | null>;
	findOneOpenByRoomIdAndVisitorToken(roomId: string, visitorToken: string, options?: FindOneOptions<IVoipRoom>): Promise<IVoipRoom | null>;

	findOneByVisitorToken(visitorToken: string, options?: FindOneOptions<IVoipRoom>): Promise<IVoipRoom | null>;
	findOneByIdAndVisitorToken(_id: IVoipRoom['_id'], visitorToken: string, options?: FindOneOptions<IVoipRoom>): Promise<IVoipRoom | null>;
	closeByRoomId(roomId: IVoipRoom['_id'], closeInfo: IRoomClosingInfo): Promise<WriteOpResult>;

	findRoomsWithCriteria({
		agents,
		open,
		createdAt,
		closedAt,
		tags,
		queue,
		visitorId,
		options,
	}: {
		agents?: string[];
		open?: boolean;
		createdAt?: { start?: string; end?: string };
		closedAt?: { start?: string; end?: string };
		tags?: string[];
		queue?: string;
		visitorId?: string;
		options?: {
			sort?: Record<string, unknown>;
			count?: number;
			fields?: Record<string, unknown>;
			offset?: number;
		};
	}): Cursor<IVoipRoom>;
}
