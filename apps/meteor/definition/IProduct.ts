import { IRocketChatRecord } from './IRocketChatRecord';
import { PartialBy } from './PartialBy';
import { IPaginationOptions } from './ITeam';
import { IQueryOptions } from './ITeam';
import { IRecordsWithTotal } from './ITeam';

export interface IProduct extends IRocketChatRecord {
	title: string;
	description: string;
	price: number;
	ranking: number;
}

export type IProductLean = Omit<IProduct, 'createdAt' | '_updatedAt' | '_id'>;

export type IProductCreateParams = PartialBy<IProductLean, 'ranking'>;

export interface IProductService {
	create(params: IProductCreateParams): Promise<IProduct>;
	list(paginationOptions?: IPaginationOptions, queryOptions?: IQueryOptions<IProduct>): Promise<IRecordsWithTotal<IProduct>>;
	update(productId: string, params: Partial<IProductCreateParams>): Promise<IProduct>;
	delete(productId: string): Promise<void>;
}
