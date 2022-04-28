import { AtLeastOne } from './AtLeastOne';
import { IPost } from './IPost';
import { IBlog } from './IBlog';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal } from './ITeam';

export interface IComment extends IPost {
	blogId: IBlog['_id'];
	parentId: IPost['_id'];
}

export type ICommentWithoutID = Omit<IComment, '_id'>;

export type ICommentLean = Omit<IComment, 'createdAt' | '_updatedAt' | '_id'>;

export type ICommentCreateParams = Omit<IComment, 'createdAt' | '_updatedAt' | '_id'>;

export type ICommentUpdateParams = AtLeastOne<ICommentLean>;

export type ICommentUpdateBody = ICommentUpdateParams & { _updatedAt: IComment['_updatedAt'] };

export interface ICommentService {
	create(params: ICommentCreateParams): Promise<IComment>;
	list(paginationOptions?: IPaginationOptions, queryOptions?: IQueryOptions<IComment>): Promise<IRecordsWithTotal<IComment>>;
	update(commentId: string, params: ICommentUpdateParams): Promise<IComment>;
	delete(commentId: string): Promise<void>;
	getComment(commentId: string): Promise<IComment>;
}
