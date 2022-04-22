import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';
import { ITag } from './ITag';
import { PartialBy } from './PartialBy';
import { IPaginationOptions } from './ITeam';
import { IQueryOptions } from './ITeam';
import { IRecordsWithTotal } from './ITeam';

export interface IBlog extends IRocketChatRecord {
	createdAt: Date;
	title: string;
	authorId: IUser['_id'];
	content: string;
	tags: ITag['_id'][];
}

export type IBlogLean = Omit<IBlog, 'createdAt' | '_updatedAt' | '_id'>;

export type IBlogCreateParams = PartialBy<IBlogLean, 'tags'>;

export interface IBlogService {
	create(params: IBlogCreateParams): Promise<IBlog>;
	list(paginationOptions?: IPaginationOptions, queryOptions?: IQueryOptions<IBlog>): Promise<IRecordsWithTotal<IBlog>>;
	update(blogId: string, params: Partial<IBlogCreateParams>): Promise<IBlog>;
	delete(blogId: string): Promise<void>;
}
