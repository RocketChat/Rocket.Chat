/* eslint-disable @typescript-eslint/naming-convention */
export class SelectionChannel {
	channel_id: string;

	name: string;

	is_archived: boolean;

	do_import: boolean;

	is_private: boolean;

	creator: string;

	is_direct: boolean;

	/**
	 * Constructs a new selection channel.
	 *
	 * @param {string} channel_id the unique identifier of the channel
	 * @param {string} name the name of the channel
	 * @param {boolean} is_archived whether the channel was archived or not
	 * @param {boolean} do_import whether we will be importing the channel or not
	 * @param {boolean} is_private whether the channel is private or public
	 * @param {int} creator the id of the channel owner
	 * @param {boolean} is_direct whether the channel represents direct messages
	 */
	constructor(
		channel_id: string,
		name: string,
		is_archived: boolean,
		do_import: boolean,
		is_private: boolean,
		creator: string,
		is_direct: boolean,
	) {
		this.channel_id = channel_id;
		this.name = name;
		this.is_archived = is_archived;
		this.do_import = do_import;
		this.is_private = is_private;
		this.creator = creator;
		this.is_direct = is_direct;
	}
}
