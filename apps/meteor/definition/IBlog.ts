import { IRocketChatRecord } from './IRocketChatRecord';
import { IUser } from './IUser';
import { ITag } from './ITag';
import { PartialBy } from './PartialBy';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal } from './ITeam';
import { AtLeastOne } from './AtLeastOne';

export interface IBlog extends IRocketChatRecord {
	createdAt: Date;
	title: string;
	authorId: IUser['_id'];
	content: string;
	tags: ITag['_id'][];
}

export type IBlogWithoutID = PartialBy<Omit<IBlog, '_id'>, 'tags'>;

export type IBlogLean = Omit<IBlog, 'createdAt' | '_updatedAt' | '_id'>;

export type IBlogCreateParams = PartialBy<IBlogLean, 'tags'>;

export type IBlogCreateBody = PartialBy<Omit<IBlog, '_id'>, 'tags'>;

export type IBlogUpdateParams = AtLeastOne<IBlogLean>;

export type IBlogUpdateBody = IBlogUpdateParams & { _updatedAt: IBlog['_updatedAt'] };

export interface IBlogService {
	create(params: IBlogCreateParams): Promise<IBlog>;
	list(paginationOptions?: IPaginationOptions, queryOptions?: IQueryOptions<IBlog>): Promise<IRecordsWithTotal<IBlog>>;
	update(blogId: string, params: IBlogUpdateParams): Promise<IBlog>;
	delete(blogId: string): Promise<void>;
	getBlog(blogId: string): Promise<IBlog>;
}
