import type { SelectionChannel } from './ImporterSelectionChannel';
import type { SelectionUser } from './ImporterSelectionUser';

export class Selection {
	name: string;

	users: SelectionUser[];

	channels: SelectionChannel[];

	message_count: number;

	/**
	 * Constructs a new importer selection object.
	 *
	 * @param {string} name the name of the importer
	 * @param {SelectionUser[]} users the users which can be selected
	 * @param {SelectionChannel[]} channels the channels which can be selected
	 * @param {number} message_count the number of messages
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	constructor(name: string, users: SelectionUser[], channels: SelectionChannel[], message_count: number) {
		this.name = name;
		this.users = users;
		this.channels = channels;
		this.message_count = message_count;
	}
}
