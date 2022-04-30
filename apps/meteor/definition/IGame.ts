import { IRocketChatRecord } from './IRocketChatRecord';
import { ITag } from './ITag';
import { PartialBy } from './PartialBy';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal } from './ITeam';
import { AtLeastOne } from './AtLeastOne';

export interface IGame extends IRocketChatRecord {
	createdAt: Date;
	title: string;
	description: string;
	tags: ITag['_id'][];
	ranking: number;
}

export type IGameWithoutID = PartialBy<Omit<IGame, '_id'>, 'tags' | 'ranking'>;

export type IGameLean = Omit<IGame, 'createdAt' | '_updatedAt' | '_id'>;

export type IGameCreateParams = PartialBy<IGameLean, 'tags' | 'ranking'>;

export type IGameUpdateParams = AtLeastOne<IGameLean>;

export type IGameUpdateBody = IGameUpdateParams & { _updatedAt: IGame['_updatedAt'] };

export interface IGameService {
	create(params: IGameCreateParams): Promise<IGame>;
	list(paginationOptions?: IPaginationOptions, queryOptions?: IQueryOptions<IGame>): Promise<IRecordsWithTotal<IGame>>;
	update(gameId: string, params: IGameUpdateParams): Promise<IGame>;
	delete(gameId: string): Promise<void>;
	getGame(gameId: string): Promise<IGame>;
}
