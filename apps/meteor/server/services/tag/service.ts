import { Cursor } from 'mongodb';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { ITagService, ITagCreateParams, ITag, ITagUpdateBody, ITagUpdateParams } from '../../../definition/ITag';
import { IPaginationOptions, IQueryOptions } from '../../../definition/ITeam';
import { CreateObject } from '../../../definition/ICreate';
import { UpdateObject } from '../../../definition/IUpdate';
import { InsertionModel } from '../../../app/models/server/raw/BaseRaw';
import { TagModel } from '../../../app/models/server/raw';
import { TagsRaw } from '../../../app/models/server/raw/Tags';

export class TagService extends ServiceClassInternal implements ITagService {
	protected name = 'tag';

	private TagModel: TagsRaw = TagModel;

	async create(params: ITagCreateParams): Promise<ITag> {
		const createData: InsertionModel<ITag> = {
			...new CreateObject(),
			...params,
		};
		const result = await this.TagModel.insertOne(createData);
		return this.TagModel.findOneById(result.insertedId);
	}

	async delete(tagId: string): Promise<void> {
		await this.getTag(tagId);
		await this.TagModel.removeById(tagId);
	}

	async getTag(tagId: string): Promise<ITag> {
		const tag = this.TagModel.findOneById(tagId);
		if (!tag) {
			throw new Error('tag-does-not-exist');
		}
		return tag;
	}

	async update(tagId: string, params: ITagUpdateParams): Promise<ITag> {
		await this.getTag(tagId);
		const query = {
			_id: tagId,
		};
		const updateData: ITagUpdateBody = {
			...new UpdateObject(),
			...params,
		};
		const result = await this.TagModel.updateOne(query, { $set: updateData });
		return this.TagModel.findOneById(result.upsertedId._id.toHexString());
	}

	list(
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		{ sort, query }: IQueryOptions<ITag> = { sort: {} },
	): Cursor<ITag> {
		const result = this.TagModel.find(
			{ ...query },
			{
				...(sort && { sort }),
				limit: count,
				skip: offset,
			},
		);
		return this.TagModel.find(
			{ ...query },
			{
				...(sort && { sort }),
				limit: count,
				skip: offset,
			},
		);
	}
}
