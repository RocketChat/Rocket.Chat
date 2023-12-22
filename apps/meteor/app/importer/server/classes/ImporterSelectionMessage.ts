/* eslint-disable @typescript-eslint/naming-convention */
export class SelectionMessage {
	message_id: string;

	rid: string;

	u: string;

	/**
	 * Constructs a new selection message.
	 *
	 * @param {string} message_id
	 * @param {string} rid the rid of the channel
	 * @param {string} u user
	 */
	constructor(message_id: string, rid: string, u: string) {
		this.message_id = message_id;
		this.rid = rid;
		this.u = u;
	}
}
