import { type IMessage } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import type BadWordsFilter from 'bad-words';

export class BeforeSaveBadWords {
	badWords: BadWordsFilter | null = null;

	badWordsRegex: RegExp | null = null;

	protected logger: Logger;

	constructor() {
		this.logger = new Logger('BadWordsFilter');
	}

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

		try {
			this.badWordsRegex = new RegExp(`(?<=^|[\\p{P}\\p{Z}])(${badWords.join('|')})(?=$|[\\p{P}\\p{Z}])`, 'gmiu');
		} catch (error) {
			this.badWordsRegex = null;
			this.logger.error('Erorr when initializing bad words filter', error);
		}

		if (goodWordsList?.length) {
			this.badWords.removeWords(...goodWordsList.split(',').map((word) => word.trim()));
		}
	}

	disable() {
		this.badWords = null;
		this.badWordsRegex = null;
	}

	async filterBadWords({ message }: { message: IMessage }): Promise<IMessage> {
		if (!message.msg || !this.badWords) {
			return message;
		}

		try {
			message.msg = this.badWords.clean(message.msg);
		} catch (error) {
			// ignore
		} finally {
			if (this.badWordsRegex) {
				message.msg = message.msg.replace(this.badWordsRegex, (match) => '*'.repeat(match.length));
			}
		}

		return message;
	}
}
