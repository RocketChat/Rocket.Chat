import { Base } from '../../../../../app/models/server';

/**
 * Livechat Priority model
 */
export class LivechatPriority extends Base {
	constructor() {
		super('livechat_priority');

		this.tryEnsureIndex(
			{ name: 1 },
			{
				unique: true,
				partialFilterExpression: {
					$and: [{ name: { $exists: true } }, { name: { $gt: '' } }],
				},
			},
		);
		this.tryEnsureIndex({ sortItem: 1 });
	}

	// FIND
	findOneById(_id, options) {
		const query = { _id };

		return this.findOne(query, options);
	}

	findOneByIdOrName(_idOrName, options) {
		const query = {
			$or: [
				{
					_id: _idOrName,
				},
				{
					name: _idOrName,
				},
			],
		};

		return this.findOne(query, options);
	}
}

export default new LivechatPriority();
