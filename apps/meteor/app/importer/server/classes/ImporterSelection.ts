import type { IImporterSelection, IImporterSelectionChannel, IImporterSelectionUser } from '@rocket.chat/core-typings';

export class ImporterSelection implements IImporterSelection {
	public name: string;

	public users: IImporterSelectionUser[];

	public channels: IImporterSelectionChannel[];

	public message_count: number;

	/**
	 * Constructs a new importer selection object.
	 *
	 * @param name the name of the importer
	 * @param users the users which can be selected
	 * @param channels the channels which can be selected
	 * @param messageCount the number of messages
	 */
	constructor(name: string, users: IImporterSelectionUser[], channels: IImporterSelectionChannel[], messageCount: number) {
		this.name = name;
		this.users = users;
		this.channels = channels;
		this.message_count = messageCount;
	}
}
