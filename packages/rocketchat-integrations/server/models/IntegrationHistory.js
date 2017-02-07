RocketChat.models.IntegrationHistory = new class IntegrationHistory extends RocketChat.models._Base {
	constructor() {
		super('integration_history');
	}

	findByType(type, options) {
		if (type !== 'outgoing-webhook' || type !== 'incoming-webhook') {
			throw new Meteor.Error('invalid-integration-type');
		}

		return this.find({ type }, options);
	}

	findByIntegrationId(id, options) {
		return this.find({ 'integration._id': id }, options);
	}

	findByIntegrationIdAndCreatedBy(id, creatorId, options) {
		return this.find({ 'integration._id': id, 'integration._createdBy._id': creatorId }, options);
	}

	findByEventName(event, options) {
		return this.find({ event }, options);
	}

	findFailed(options) {
		return this.find({ error: true }, options);
	}
};
