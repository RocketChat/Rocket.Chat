import { Base } from '../../../../../app/models';

/**
 * Livechat Priority model
 */
export class LivechatPriority extends Base {
	constructor() {
		super('livechat_priority');

		this.tryEnsureIndex({ name: 1 }, { unique: true });
		this.tryEnsureIndex({ dueTimeInMinutes: 1 }, { unique: true });
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

	createOrUpdatePriority(_id, { name, description, color, dueTimeInMinutes }) {
		const record = {
			name,
			description,
			color,
			dueTimeInMinutes: parseInt(dueTimeInMinutes),
		};

		if (_id) {
			this.update({ _id }, { $set: record });
		} else {
			_id = this.insert(record);
		}

		return Object.assign(record, { _id });
	}

	// REMOVE
	removeById(_id) {
		const query = { _id };

		return this.remove(query);
	}
}

export default new LivechatPriority();
