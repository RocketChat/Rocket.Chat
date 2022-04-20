import { Base } from './_Base';

export class EmojiCustom extends Base {
	constructor() {
		super();
		this._initModel('custom_emoji');
	}

	// find
	findByNameOrAlias(name, options) {
		const query = {
			$or: [{ name }, { aliases: name }],
		};

		return this.find(query, options);
	}
}

export default new EmojiCustom();
