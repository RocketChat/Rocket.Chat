import { Cursor } from 'mongodb';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { IProductService, IProductCreateParams, IProduct, IProductUpdateBody, IProductUpdateParams } from '../../../definition/IProduct';
import { ProductsRaw } from '../../../app/models/server/raw/Products';
import { IPaginationOptions, IQueryOptions } from '../../../definition/ITeam';
import { CreateObject } from '../../../definition/ICreate';
import { UpdateObject } from '../../../definition/IUpdate';
import { InsertionModel } from '../../../app/models/server/raw/BaseRaw';
import { ProductsModel } from '../../../app/models/server/raw';

export class ProductService extends ServiceClassInternal implements IProductService {
	protected name = 'product';

	private ProductModel: ProductsRaw = ProductsModel;

	async create(params: IProductCreateParams): Promise<IProduct> {
		const createData: InsertionModel<IProduct> = {
			...new CreateObject(),
			...params,
			...(params.ranking ? { ranking: params.ranking } : { ranking: 0 }),
		};
		const result = await this.ProductModel.insertOne(createData);
		return this.ProductModel.findOneById(result.insertedId);
	}

	async delete(productId: string): Promise<void> {
		await this.getProduct(productId);
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
		await this.getProduct(productId);
		const query = {
			_id: productId,
		};
		const updateData: IProductUpdateBody = {
			...new UpdateObject(),
			...params,
		};
		const result = await this.ProductModel.updateOne(query, { $set: updateData });
		return this.ProductModel.findOneById(result.upsertedId._id.toHexString());
	}

	list(
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		{ sort, query }: IQueryOptions<IProduct> = { sort: {} },
	): Cursor<IProduct> {
		return this.ProductModel.find(
			{ ...query },
			{
				...(sort && { sort }),
				limit: count,
				skip: offset,
			},
		);
	}
}
