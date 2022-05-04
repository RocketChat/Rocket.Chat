import { AggregationCursor } from 'mongodb';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { IBlogService, IBlogCreateParams, IBlog, IBlogUpdateBody, IBlogUpdateParams } from '../../../definition/IBlog';
import { CreateObject } from '../../../definition/ICreate';
import { UpdateObject } from '../../../definition/IUpdate';
import { InsertionModel } from '../../../app/models/server/raw/BaseRaw';
import { BlogModel } from '../../../app/models/server/raw';
import { BlogsRaw } from '../../../app/models/server/raw/Blogs';

export class BlogService extends ServiceClassInternal implements IBlogService {
	protected name = 'blog';

	private BlogModel: BlogsRaw = BlogModel;

	async create(params: IBlogCreateParams): Promise<IBlog> {
		const createData: InsertionModel<IBlog> = {
			...new CreateObject(),
			...params,
			...(params.tags ? { tags: params.tags } : { tags: [] }),
		};
		const result = await this.BlogModel.insertOne(createData);
		return this.BlogModel.findOneById(result.insertedId);
	}

	async delete(blogId: string): Promise<void> {
		await this.getBlog(blogId);
		await this.BlogModel.removeById(blogId);
	}

	async getBlog(blogId: string): Promise<IBlog> {
		const blog = await this.BlogModel.findOneById(blogId);
		if (!blog) {
			throw new Error('blog-does-not-exist');
		}
		return blog;
	}

	async update(blogId: string, params: IBlogUpdateParams): Promise<IBlog> {
		await this.getBlog(blogId);
		const query = {
			_id: blogId,
		};
		const updateData: IBlogUpdateBody = {
			...new UpdateObject(),
			...params,
		};
		const result = await this.BlogModel.updateOne(query, { $set: updateData });
		return this.BlogModel.findOneById(blogId);
	}

	list(limit = 10): AggregationCursor<IBlog> {
		return this.BlogModel.getBlogsWithComments(limit);
	}
}
