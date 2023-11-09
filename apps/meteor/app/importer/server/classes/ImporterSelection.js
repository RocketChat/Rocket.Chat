export class Selection {
	/**
	 * Constructs a new importer selection object.
	 *
	 * @param {string} name the name of the importer
	 * @param {SelectionUser[]} users the users which can be selected
	 * @param {SelectionChannel[]} channels the channels which can be selected
	 * @param {number} message_count the number of messages
	 * @param {SelectionMessage[]} messages the messages from this import (with only: _id, rid, u)
	 */
	constructor(name, users, channels, messages, ) {
		this.name = name;
		this.users = users;
		this.channels = channels;
		this.messages = messages;
		this.message_count = message_count;
	}
}
