import { type IMessage } from '@rocket.chat/core-typings';
import type BadWordsFilter from 'bad-words';

export class BeforeSaveBadWords {
	badWords: BadWordsFilter | null = null;

	async configure(badWordsList?: string, goodWordsList?: string) {
		const { default: Filter } = await import('bad-words');

		const options = {
			list:
				badWordsList
					?.split(',')
					.map((word) => word.trim())
					.filter(Boolean) || [],
			// library definition does not allow optional definition
			exclude: undefined,
			splitRegex: undefined,
			placeHolder: undefined,
			regex: undefined,
			replaceRegex: undefined,
			emptyList: undefined,
		};

		this.badWords = new Filter(options);

		if (goodWordsList?.length) {
			this.badWords.removeWords(...goodWordsList.split(',').map((word) => word.trim()));
		}
	}

	disable() {
		this.badWords = null;
	}

	async filterBadWords({ message }: { message: IMessage }): Promise<IMessage> {
		if (!message.msg || !this.badWords) {
			return message;
		}

		try {
			message.msg = this.badWords.clean(message.msg);
		} catch (error) {
			// ignore
		}

		return message;
	}
}
