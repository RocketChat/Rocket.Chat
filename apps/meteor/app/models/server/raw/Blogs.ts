import { BaseRaw } from './BaseRaw';
import { IBlog as T } from '../../../../definition/IBlog';
import { IRecordsWithTotal } from '../../../../definition/ITeam';

export class BlogsRaw extends BaseRaw<T> {
	async getBlogsWithComments(limit = 10): Promise<IRecordsWithTotal<T>> {
		const pipeline = [
			{
				$lookup: {
					from: 'comments',
					as: 'comments',
					let: { post: '$_id' },
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: ['$blogId', '$$post'],
								},
							},
						},
						{ $limit: limit },
					],
				},
			},
		];
		const cursor = this.col.aggregate(pipeline);
		return {
			total: await cursor.count(),
			records: await cursor.toArray(),
		};
	}
}
