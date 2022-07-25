import type { FindOptions, UpdateResult, Document, FindCursor } from 'mongodb';
import type { IVoipRoom, IRoomClosingInfo } from '@rocket.chat/core-typings';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface IVoipRoomModel extends IBaseModel<IVoipRoom> {
	findOneOpenByVisitorToken(visitorToken: string, options?: FindOptions<IVoipRoom>): Promise<IVoipRoom | null>;
	findOpenByAgentId(agentId: string): FindCursor<IVoipRoom>;
	findOneByAgentId(agentId: string): Promise<IVoipRoom | null>;

	findOneVoipRoomById(id: string, options?: FindOptions<IVoipRoom>): Promise<IVoipRoom | null>;
	findOneOpenByRoomIdAndVisitorToken(roomId: string, visitorToken: string, options?: FindOptions<IVoipRoom>): Promise<IVoipRoom | null>;

	findOneByVisitorToken(visitorToken: string, options?: FindOptions<IVoipRoom>): Promise<IVoipRoom | null>;
	findOneByIdAndVisitorToken(_id: IVoipRoom['_id'], visitorToken: string, options?: FindOptions<IVoipRoom>): Promise<IVoipRoom | null>;
	closeByRoomId(roomId: IVoipRoom['_id'], closeInfo: IRoomClosingInfo): Promise<Document | UpdateResult>;

	findRoomsWithCriteria({
		agents,
		open,
		createdAt,
		closedAt,
		tags,
		queue,
		visitorId,
		direction,
		roomName,
		options,
	}: {
		agents?: string[];
		open?: boolean;
		createdAt?: { start?: string; end?: string };
		closedAt?: { start?: string; end?: string };
		tags?: string[];
		queue?: string;
		visitorId?: string;
		direction?: IVoipRoom['direction'];
		roomName?: string;
		options?: {
			sort?: FindOptions<IVoipRoom>['sort'];
			count?: number;
			fields?: Record<string, unknown>;
			offset?: number;
		};
	}): FindPaginated<FindCursor<IVoipRoom>>;
}
