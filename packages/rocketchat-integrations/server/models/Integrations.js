RocketChat.models.Integrations = new class Integrations extends RocketChat.models._Base {
	constructor() {
		super('integrations');
	}

	findByType(type, options) {
		if (type !== 'webhook-incoming' && type !== 'webhook-outgoing') {
			throw new Meteor.Error('invalid-type-to-find');
		}

		return this.find({ type }, options);
	}

	disableByUserId(userId) {
		return this.update({ userId }, { $set: { enabled: false }}, { multi: true });
	}
};
