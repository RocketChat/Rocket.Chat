import { type IMessage } from '@rocket.chat/core-typings';
import type BadWordsFilter from 'bad-words';

export class BeforeSaveBadWords {
	badWords: BadWordsFilter | null = null;

	badWordsRegex: RegExp | null = null;

	async configure(badWordsList?: string, goodWordsList?: string) {
		const { default: Filter } = await import('bad-words');
		const badWords =
			badWordsList
				?.split(',')
				.map((word) => word.trim())
				.filter(Boolean) || [];

		const options = {
			list: badWords,
			// library definition does not allow optional definition
			exclude: undefined,
			splitRegex: undefined,
			placeHolder: undefined,
			regex: undefined,
			replaceRegex: undefined,
			emptyList: undefined,
		};

		this.badWords = new Filter(options);
		this.badWordsRegex = new RegExp(`(?<=^|[\\p{P}\\p{Z}])(${badWords.join('|')})(?=$|[\\p{P}\\p{Z}])`, 'gmiu');

		if (goodWordsList?.length) {
			this.badWords.removeWords(...goodWordsList.split(',').map((word) => word.trim()));
		}
	}

	disable() {
		this.badWords = null;
		this.badWordsRegex = null;
	}

	async filterBadWords({ message }: { message: IMessage }): Promise<IMessage> {
		if (!message.msg || !this.badWords || !this.badWordsRegex) {
			return message;
		}

		try {
			message.msg = this.badWords.clean(message.msg);
		} catch (error) {
			// ignore
		} finally {
			message.msg = message.msg.replace(this.badWordsRegex, (match) => '*'.repeat(match.length));
		}

		return message;
	}
}
