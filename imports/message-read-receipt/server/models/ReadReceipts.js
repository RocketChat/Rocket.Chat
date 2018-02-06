class ModelReadReceipts extends RocketChat.models._Base {
	constructor() {
		super(...arguments);

		this.tryEnsureIndex({
			roomId: 1,
			userId: 1,
			messageId: 1
		}, {
			unique: 1
		});
	}
}

export default new ModelReadReceipts('message_read_receipt', true);
