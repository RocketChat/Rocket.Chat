import type { ICustomEmojiDescriptor } from '@rocket.chat/core-typings';
import type { Mongo } from 'meteor/mongo';

import { Base } from './Base';

class EmojiCustom extends Base<ICustomEmojiDescriptor> {
	constructor() {
		super();
		this._initModel('custom_emoji');
	}

	// find
	findByNameOrAlias(name: ICustomEmojiDescriptor['name'], options?: Mongo.Options<ICustomEmojiDescriptor>) {
		const query = {
			$or: [{ name }, { aliases: name }],
		};

		return this.find(query, options);
	}
}

export default new EmojiCustom();
