import { IRocketChatRecord } from './IRocketChatRecord';
import { IPaginationOptions } from './ITeam';
import { IQueryOptions } from './ITeam';
import { IRecordsWithTotal } from './ITeam';

export interface ITag extends IRocketChatRecord {
	title: string;
	createdAt: Date;
}

export type ITagCreateParams = Omit<ITag, 'createdAt' | '_updatedAt' | '_id'>;

export interface ITagService {
	create(params: ITagCreateParams): Promise<ITag>;
	list(paginationOptions?: IPaginationOptions, queryOptions?: IQueryOptions<ITag>): Promise<IRecordsWithTotal<ITag>>;
	update(tagId: string, params: Partial<ITagCreateParams>): Promise<ITag>;
	delete(tagId: string): Promise<void>;
}
