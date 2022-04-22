import { Db } from 'mongodb';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { ITagService, ITagCreateParams, ITag } from '../../../definition/ITag';
import { TagsRaw } from '../../../app/models/server/raw/Tags';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal } from '../../../definition/ITeam';

export class TagService extends ServiceClassInternal implements ITagService {
	protected name = 'tag';

	private TagModel: TagsRaw;

	constructor(db: Db) {
		super();

		this.TagModel = new TagsRaw(db.collection('tags'));
	}

	async create(params: ITagCreateParams): Promise<ITag> {
		const result = await this.TagModel.insertOne(params);
		return this.TagModel.findOneById(result.insertedId);
	}

	async delete(tagId: string): Promise<void> {
		const tag = this.TagModel.findOneById(tagId);
		if (!tag) {
			throw new Error('tag-does-not-exist');
		}
		await this.TagModel.removeById(tagId);
	}

	async update(tagId: string, params: Partial<ITagCreateParams>): Promise<ITag> {
		const tag = this.TagModel.findOneById(tagId);
		if (!tag) {
			throw new Error('tag-does-not-exist');
		}
		const query = {
			_id: tagId,
		};
		const result = await this.TagModel.updateOne(query, params);
		return this.TagModel.findOneById(result.upsertedId._id.toHexString());
	}

	async list(
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		{ sort, query }: IQueryOptions<ITag> = { sort: {} },
	): Promise<IRecordsWithTotal<ITag>> {
		const result = this.TagModel.find(
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
