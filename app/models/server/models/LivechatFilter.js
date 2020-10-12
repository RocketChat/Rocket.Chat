import { Base } from './_Base';

/**
 * Livechat Filter model
 */
export class LivechatFilter extends Base {
	constructor() {
		super('livechat_filter');
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

export default new LivechatFilter();
