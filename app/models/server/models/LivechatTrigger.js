import { Base } from './_Base';

/**
 * Livechat Trigger model
 */
export class LivechatTrigger extends Base {
	constructor() {
		super('livechat_trigger');

		this.tryEnsureIndex({ enabled: 1 });
	}

	updateById(_id, data) {
		return this.update({ _id }, { $set: data });
	}

	removeAll() {
		return this.remove({});
	}

	findById(_id) {
		return this.find({ _id });
	}

	removeById(_id) {
		return this.remove({ _id });
	}

	findEnabled() {
		return this.find({ enabled: true });
	}
}

export default new LivechatTrigger();
