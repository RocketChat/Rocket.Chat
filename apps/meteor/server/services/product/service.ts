import { Db } from 'mongodb';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import {
	IProductService,
	IProductCreateParams,
	IProduct,
	IProductCreateBody,
	IProductUpdateBody,
	IProductUpdateParams,
} from '../../../definition/IProduct';
import { ProductsRaw } from '../../../app/models/server/raw/Products';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal } from '../../../definition/ITeam';
import { CreateObject } from '../../../definition/ICreate';
import { UpdateObject } from '../../../definition/IUpdate';

export class ProductService extends ServiceClassInternal implements IProductService {
	protected name = 'product';

	private ProductModel: ProductsRaw;

	constructor(db: Db) {
		super();

		this.ProductModel = new ProductsRaw(db.collection('products'));
	}

	async create(params: IProductCreateParams): Promise<IProduct> {
		const createData: IProductCreateBody = {
			...new CreateObject(),
			...params,
		};
		const result = await this.ProductModel.insertOne(createData);
		return this.ProductModel.findOneById(result.insertedId);
	}

	async delete(productId: string): Promise<void> {
		const product = this.ProductModel.findOneById(productId);
		if (!product) {
			throw new Error('product-does-not-exist');
		}
		await this.ProductModel.removeById(productId);
	}

	async getProduct(productId: string): Promise<IProduct> {
		const product = this.ProductModel.findOneById(productId);
		if (!product) {
			throw new Error('product-does-not-exist');
		}
		return product;
	}

	async update(productId: string, params: IProductUpdateParams): Promise<IProduct> {
		const product = this.ProductModel.findOneById(productId);
		if (!product) {
			throw new Error('product-does-not-exist');
		}
		const query = {
			_id: productId,
		};
		const updateData: IProductUpdateBody = {
			...new UpdateObject(),
			...params,
		};
		const result = await this.ProductModel.updateOne(query, updateData);
		return this.ProductModel.findOneById(result.upsertedId._id.toHexString());
	}

	async list(
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		{ sort, query }: IQueryOptions<IProduct> = { sort: {} },
	): Promise<IRecordsWithTotal<IProduct>> {
		const result = this.ProductModel.find(
			{ ...query },
			{
				...(sort && { sort }),
				limit: count,
				skip: offset,
			},
		);
		return {
			total: await result.count(),
			records: await result.toArray(),
		};
	}
}
