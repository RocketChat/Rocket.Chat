import { Cursor } from 'mongodb';

import { AtLeastOne } from './AtLeastOne';
import { IRocketChatRecord } from './IRocketChatRecord';
import { IPaginationOptions, IQueryOptions } from './ITeam';
import { PartialBy } from './PartialBy';

export interface IGateway extends IRocketChatRecord {
	show: boolean;
	active: boolean;
	sortOrder: number;
	icon: string;
	cmpClass?: string;
	cmpConfig?: Record<string, any>;
}

export type IGatewayLean = Omit<IGateway, '_id' | '_updatedAt'>;

export type IGatewayCreateParams = PartialBy<Omit<IGateway, '_updatedAt'>, 'cmpClass' | 'cmpConfig'>;

export type IGatewayUpdateParams = AtLeastOne<IGatewayLean>;

export interface IGatewayService {
	create(params: IGatewayCreateParams): Promise<IGateway>;
	list(paginationOptions?: IPaginationOptions, queryOptions?: IQueryOptions<IGateway>): Cursor<IGateway>;
	update(gatewayId: IGateway['_id'], params: IGatewayUpdateParams): Promise<IGateway>;
	delete(gatewayId: IGateway['_id']): Promise<void>;
	getGateway(gatewayId: IGateway['_id']): Promise<IGateway>;
}
