import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { IBlogService, IBlogCreateParams, IBlog, IBlogUpdateBody, IBlogUpdateParams } from '../../../definition/IBlog';
import { IRecordsWithTotal } from '../../../definition/ITeam';
import { CreateObject } from '../../../definition/ICreate';
import { UpdateObject } from '../../../definition/IUpdate';
import { InsertionModel } from '../../../app/models/server/raw/BaseRaw';
import { BlogModel } from '../../../app/models/server/raw';

export class BlogService extends ServiceClassInternal implements IBlogService {
	protected name = 'blog';

	async create(params: IBlogCreateParams): Promise<IBlog> {
		const createData: InsertionModel<IBlog> = {
			...new CreateObject(),
			...params,
			...(params.tags ? { tags: params.tags } : { tags: [] }),
		};
		const result = await BlogModel.insertOne(createData);
		return BlogModel.findOneById(result.insertedId);
	}

	async delete(blogId: string): Promise<void> {
		await this.getBlog(blogId);
		await BlogModel.removeById(blogId);
	}

	async getBlog(blogId: string): Promise<IBlog> {
		const blog = await BlogModel.findOneById(blogId);
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
		const result = await BlogModel.updateOne(query, { $set: updateData });
		console.log(result);
		return BlogModel.findOneById(blogId);
	}

	async list(limit = 10): Promise<IRecordsWithTotal<IBlog>> {
		return BlogModel.getBlogsWithComments(limit);
	}
}
