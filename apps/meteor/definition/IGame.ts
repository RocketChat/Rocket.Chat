import { IRocketChatRecord } from './IRocketChatRecord';
import { ITag } from './ITag';
import { PartialBy } from './PartialBy';
import { IPaginationOptions } from './ITeam';
import { IQueryOptions } from './ITeam';
import { IRecordsWithTotal } from './ITeam';

export interface IGame extends IRocketChatRecord {
	title: string;
	description: string;
	tags: ITag['_id'][];
	ranking: number;
}

export type IGameLean = Omit<IGame, 'createdAt' | '_updatedAt' | '_id'>;

export type IGameCreateParams = PartialBy<IGameLean, 'tags'>;

export interface IGameService {
	create(params: IGameCreateParams): Promise<IGame>;
	list(paginationOptions?: IPaginationOptions, queryOptions?: IQueryOptions<IGame>): Promise<IRecordsWithTotal<IGame>>;
	update(gameId: string, params: Partial<IGameCreateParams>): Promise<IGame>;
	delete(gameId: string): Promise<void>;
}
