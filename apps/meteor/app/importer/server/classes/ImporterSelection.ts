import type { IImporterSelection, IImporterSelectionChannel, IImporterSelectionUser } from '@rocket.chat/core-typings';

export class Selection implements IImporterSelection {
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
	 * @param message_count the number of messages
	 */
	/* eslint-disable-next-line @typescript-eslint/naming-convention */
	constructor(name: string, users: IImporterSelectionUser[], channels: IImporterSelectionChannel[], message_count: number) {
		this.name = name;
		this.users = users;
		this.channels = channels;
		this.message_count = message_count;
	}
}
