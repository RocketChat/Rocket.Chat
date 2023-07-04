import type { IImporterSelectionChannel } from '@rocket.chat/core-typings';

export class SelectionChannel implements IImporterSelectionChannel {
	public channel_id: string;

	public name: string | undefined;

	public is_archived: boolean;

	public do_import: boolean;

	public is_private: boolean;

	public is_direct: boolean;

	/**
	 * Constructs a new selection channel.
	 *
	 * @param channel_id the unique identifier of the channel
	 * @param name the name of the channel
	 * @param is_archived whether the channel was archived or not
	 * @param do_import whether we will be importing the channel or not
	 */
	constructor(
		/* eslint-disable @typescript-eslint/naming-convention */
		channel_id: string,
		name: string | undefined,
		is_archived: boolean,
		do_import: boolean,
		is_private: boolean,
		is_direct: boolean,
		/* eslint-enable @typescript-eslint/naming-convention */
	) {
		this.channel_id = channel_id;
		this.name = name;
		this.is_archived = is_archived;
		this.do_import = do_import;
		this.is_private = is_private;
		this.is_direct = is_direct;
	}
}
