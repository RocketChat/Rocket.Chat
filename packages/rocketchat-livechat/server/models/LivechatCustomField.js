/**
 * Livechat Custom Fields model
 */
class LivechatCustomField extends RocketChat.models._Base {
	constructor() {
		super();
		this._initModel('livechat_custom_field');

		this.tryEnsureIndex({ 'token': 1 });
		this.tryEnsureIndex({ 'ts': 1 });
	}

	saveByToken(token, key, value) {
		return this.upsert({
			token: token,
			key: key
		}, { $set: {
			value: value,
			ts: new Date()
		} });
	}

	findByToken(token) {
		return this.find({ token: token }, { sort : { ts: -1 }, limit: 20 });
	}
}

RocketChat.models.LivechatCustomField = new LivechatCustomField();
