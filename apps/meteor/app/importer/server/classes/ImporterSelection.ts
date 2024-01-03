import type { IImporterSelection, IImporterSelectionChannel, IImporterSelectionUser } from '@rocket.chat/core-typings';

import type { SelectionMessage } from './ImporterSelectionMessage';

export class ImporterSelection implements IImporterSelection {
	public name: string;

	public users: IImporterSelectionUser[];

	public channels: IImporterSelectionChannel[];

	public message_count: number;

	public messages: SelectionMessage[];

	/**
	 * Constructs a new importer selection object.
	 *
	 * @param name the name of the importer
	 * @param users the users which can be selected
	 * @param channels the channels which can be selected
	 * @param messageCount the number of messages
	 * @param messages the messages from this import (with only: _id, rid, u)
	 */
	constructor(
		name: string,
		users: IImporterSelectionUser[],
		channels: IImporterSelectionChannel[],
		messageCount: number,
		messages?: SelectionMessage[],
	) {
		this.name = name;
		this.users = users;
		this.channels = channels;
		this.message_count = messageCount;
		this.messages = messages || [];
	}
}
