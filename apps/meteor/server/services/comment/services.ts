import { Db } from 'mongodb';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { ICommentService, ICommentCreateParams, IComment, ICommentUpdateBody, ICommentUpdateParams } from '../../../definition/IComment';
import { CommentsRaw } from '../../../app/models/server/raw/Comments';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal } from '../../../definition/ITeam';
import { CreateObject } from '../../../definition/ICreate';
import { UpdateObject } from '../../../definition/IUpdate';

export class CommentService extends ServiceClassInternal implements ICommentService {
	protected name = 'comment';

	private CommentModel: CommentsRaw;

	constructor(db: Db) {
		super();

		this.CommentModel = new CommentsRaw(db.collection('comments'));
	}

	async create(params: ICommentCreateParams): Promise<IComment> {
		const updateData: ICommentUpdateBody = {
			...new CreateObject(),
			...params,
		};
		const result = await this.CommentModel.insertOne(updateData);
		return this.CommentModel.findOneById(result.insertedId);
	}

	async delete(commentId: string): Promise<void> {
		await this.getComment(commentId);
		await this.CommentModel.removeById(commentId);
	}

	async getComment(commentId: string): Promise<IComment> {
		const comment = await this.CommentModel.findOneById(commentId);
		if (!comment) {
			throw new Error('comment-does-not-exist');
		}
		return comment;
	}

	async update(commentId: string, params: ICommentUpdateParams): Promise<IComment> {
		await this.getComment(commentId);
		const query = {
			_id: commentId,
		};
		const updateData: ICommentUpdateBody = {
			...new UpdateObject(),
			...params,
		};
		const result = await this.CommentModel.updateOne(query, updateData);
		return this.CommentModel.findOneById(result.upsertedId._id.toHexString());
	}

	async list(
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		{ sort, query }: IQueryOptions<IComment> = { sort: {} },
	): Promise<IRecordsWithTotal<IComment>> {
		const result = this.CommentModel.find(
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
