import { ITag } from './ITag';
import { PartialBy } from './PartialBy';
import { IRecordsWithTotal } from './ITeam';
import { AtLeastOne } from './AtLeastOne';
import { IPost } from './IPost';
import { IComment } from './IComment';

export interface IBlog extends IPost {
	title: string;
	tags: ITag['_id'][];
	comments?: IComment[];
}

export type IBlogWithoutID = PartialBy<Omit<IBlog, '_id'>, 'tags'>;

export type IBlogLean = Omit<IBlog, 'createdAt' | '_updatedAt' | '_id'>;

export type IBlogCreateParams = PartialBy<IBlogLean, 'tags'>;

export type IBlogCreateBody = PartialBy<Omit<IBlog, '_id'>, 'tags'>;

export type IBlogUpdateParams = AtLeastOne<IBlogLean>;

export type IBlogUpdateBody = IBlogUpdateParams & { _updatedAt: IBlog['_updatedAt'] };

export interface IBlogService {
	create(params: IBlogCreateParams): Promise<IBlog>;
	list(limit?: number): Promise<IRecordsWithTotal<IBlog>>;
	update(blogId: string, params: IBlogUpdateParams): Promise<IBlog>;
	delete(blogId: string): Promise<void>;
	getBlog(blogId: string): Promise<IBlog>;
}
