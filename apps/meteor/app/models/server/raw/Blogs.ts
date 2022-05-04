import { AggregationCursor } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { IBlog as T } from '../../../../definition/IBlog';

export class BlogsRaw extends BaseRaw<T> {
	getBlogsWithComments(limit = 10): AggregationCursor<T> {
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
		return this.col.aggregate(pipeline);
	}
}
