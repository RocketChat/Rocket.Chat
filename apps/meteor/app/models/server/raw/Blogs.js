import { BaseRaw } from './BaseRaw';

export class BlogsRaw extends BaseRaw {
	constructor(...args) {
		super(...args);

		this.defaultFields = {
			tags: [],
		};
	}

	async getBlogsWithComments(limit = 10) {
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
