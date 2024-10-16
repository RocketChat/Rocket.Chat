export class SelectionMessage {
	message_id: string;

	rid: string;

	u: string;

	/**
	 * Constructs a new selection message.
	 *
	 * @param {string} messageId the id of the message
	 * @param {string} rid the rid of the channel
	 * @param {string} u user
	 */
	constructor(messageId: string, rid: string, u: string) {
		this.message_id = messageId;
		this.rid = rid;
		this.u = u;
	}
}
