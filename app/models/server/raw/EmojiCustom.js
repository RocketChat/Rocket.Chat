import { BaseRaw } from './BaseRaw';

export class EmojiCustomRaw extends BaseRaw {
	findByNameOrAlias(emojiName, options) {
		let name = emojiName;

		if (typeof emojiName === 'string') {
			name = emojiName.replace(/:/g, '');
		}

		const query = {
			$or: [
				{ name },
				{ aliases: name },
			],
		};

		return this.find(query, options);
	}
}
