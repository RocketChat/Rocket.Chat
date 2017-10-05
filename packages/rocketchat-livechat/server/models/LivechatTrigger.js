/**
 * Livechat Trigger model
 */
class LivechatTrigger extends RocketChat.models._Base {
	constructor() {
		super('livechat_trigger');
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

RocketChat.models.LivechatTrigger = new LivechatTrigger();
