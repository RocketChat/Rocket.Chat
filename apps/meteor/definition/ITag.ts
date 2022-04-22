import { IRocketChatRecord } from './IRocketChatRecord';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal } from './ITeam';
import { AtLeastOne } from './AtLeastOne';

export interface ITag extends IRocketChatRecord {
	title: string;
	createdAt: Date;
}

export type ITagWithoutID = Omit<ITag, '_id'>;

export type ITagLean = Omit<ITag, 'createdAt' | '_updatedAt' | '_id'>;

export type ITagCreateParams = Omit<ITag, 'createdAt' | '_updatedAt' | '_id'>;

export type ITagCreateBody = Omit<ITag, '_id'>;

export type ITagUpdateParams = AtLeastOne<ITagLean>;

export type ITagUpdateBody = ITagUpdateParams & { _updatedAt: ITag['_updatedAt'] };

export interface ITagService {
	create(params: ITagCreateParams): Promise<ITag>;
	list(paginationOptions?: IPaginationOptions, queryOptions?: IQueryOptions<ITag>): Promise<IRecordsWithTotal<ITag>>;
	update(tagId: string, params: ITagUpdateParams): Promise<ITag>;
	delete(tagId: string): Promise<void>;
	getTag(tagId: string): Promise<ITag>;
}
