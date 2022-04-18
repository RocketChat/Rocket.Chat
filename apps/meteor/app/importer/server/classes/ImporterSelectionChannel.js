export class SelectionChannel {
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
	constructor(channel_id, name, is_archived, do_import, is_private, creator, is_direct) {
		this.channel_id = channel_id;
		this.name = name;
		this.is_archived = is_archived;
		this.do_import = do_import;
		this.is_private = is_private;
		this.creator = creator;
		this.is_direct = is_direct;
	}
}
