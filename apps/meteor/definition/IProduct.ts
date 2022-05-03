import { IRocketChatRecord } from './IRocketChatRecord';
import { PartialBy } from './PartialBy';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal } from './ITeam';
import { AtLeastOne } from './AtLeastOne';

export interface IProduct extends IRocketChatRecord {
	createdAt: Date;
	title: string;
	description: string;
	price: number;
	ranking: number;
}

export type IProductWithoutID = PartialBy<Omit<IProduct, '_id'>, 'ranking'>;

export type IProductLean = Omit<IProduct, 'createdAt' | '_updatedAt' | '_id'>;

export type IProductCreateParams = PartialBy<IProductLean, 'ranking'>;

export type IProductUpdateParams = AtLeastOne<IProductLean>;

export type IProductUpdateBody = IProductUpdateParams & { _updatedAt: IProduct['_updatedAt'] };

export interface IProductService {
	create(params: IProductCreateParams): Promise<IProduct>;
	list(paginationOptions?: IPaginationOptions, queryOptions?: IQueryOptions<IProduct>): Promise<IRecordsWithTotal<IProduct>>;
	update(productId: string, params: IProductUpdateParams): Promise<IProduct>;
	delete(productId: string): Promise<void>;
	getProduct(productId: string): Promise<IProduct>;
}
