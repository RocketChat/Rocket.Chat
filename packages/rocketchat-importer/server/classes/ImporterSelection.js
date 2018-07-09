export class Selection {
	/**
	 * Constructs a new importer selection object.
	 *
	 * @param {string} name the name of the importer
	 * @param {SelectionUser[]} users the users which can be selected
	 * @param {SelectionChannel[]} channels the channels which can be selected
	 * @param {number} message_count the number of messages
	 */
	constructor(name, users, channels, message_count) {
		this.name = name;
		this.users = users;
		this.channels = channels;
		this.message_count = message_count;
	}
}
