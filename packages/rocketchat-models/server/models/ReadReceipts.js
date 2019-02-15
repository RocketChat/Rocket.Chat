import { Base } from './_Base';

export class ReadReceipts extends Base {
	constructor(...args) {
		super(...args);

		this.tryEnsureIndex({
			roomId: 1,
			userId: 1,
			messageId: 1,
		}, {
			unique: 1,
		});
	}

	findByMessageId(messageId) {
		return this.find({ messageId });
	}
}

export default new ReadReceipts('message_read_receipt');
