/**
 * Livechat Trigger model
 */
class LivechatTrigger extends RocketChat.models._Base {
	constructor() {
		super();
		this._initModel('livechat_trigger');
	}

	// FIND
	save(data) {
		const trigger = this.findOne();

		if (trigger) {
			return this.update({ _id: trigger._id }, { $set: data });
		} else {
			return this.insert(data);
		}
	}

	removeAll() {
		this.remove({});
	}
}

RocketChat.models.LivechatTrigger = new LivechatTrigger();
