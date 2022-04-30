import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { IProductService, IProductCreateParams, IProduct, IProductUpdateBody, IProductUpdateParams } from '../../../definition/IProduct';

import { IPaginationOptions, IQueryOptions, IRecordsWithTotal } from '../../../definition/ITeam';
import { CreateObject } from '../../../definition/ICreate';
import { UpdateObject } from '../../../definition/IUpdate';
import { InsertionModel } from '../../../app/models/server/raw/BaseRaw';
import { ProductModel } from '../../../app/models/server/raw';

export class ProductService extends ServiceClassInternal implements IProductService {
	protected name = 'product';


	async create(params: IProductCreateParams): Promise<IProduct> {
		const createData: InsertionModel<IProduct> = {
			...new CreateObject(),
			...params,
			...(params.ranking ? { ranking: params.ranking } : { ranking: 0 }),
		};
		const result = await ProductModel.insertOne(createData);
		return ProductModel.findOneById(result.insertedId);
	}

	async delete(productId: string): Promise<void> {
		await this.getProduct(productId);
		await ProductModel.removeById(productId);
	}

	async getProduct(productId: string): Promise<IProduct> {
		const product = ProductModel.findOneById(productId);
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
		const result = await ProductModel.updateOne(query, { $set: updateData });

		return ProductModel.findOneById(productId);

	}

	async list(
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		{ sort, query }: IQueryOptions<IProduct> = { sort: {} },
	): Promise<IRecordsWithTotal<IProduct>> {
		const result = ProductModel.find(
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
