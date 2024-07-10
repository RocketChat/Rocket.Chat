import { Translation as translationService } from '@rocket.chat/core-services';
import moment from 'moment-timezone';

import { getSystemMessage } from '../livechatSystemMessages';
import exportChatTranscript from '../templates/ChatTranscript';
import type { ChatTranscriptData, PDFMessage } from '../templates/ChatTranscript';
import type { Data } from '../types/Data';
import type { IStrategy } from '../types/IStrategy';

export class ChatTranscript implements IStrategy {
	private isNewDay(current: PDFMessage, previous: PDFMessage | undefined, timezone: string): boolean {
		return !previous || !moment(current.ts).tz(timezone).isSame(previous.ts, 'day');
	}

	private async parseSystemMessage(messages: PDFMessage[]): Promise<PDFMessage[]> {
		return Promise.all(
			messages.map(async (message: PDFMessage) => {
				if (!message.t) {
					return message;
				}

				const systemMessageDefinition = getSystemMessage(message.t);
				console.log({ systemMessageDefinition });
				if (!systemMessageDefinition) {
					return message;
				}

				const args =
					systemMessageDefinition.data && (await systemMessageDefinition?.data(message, translationService.translateToServerLanguage));

				const systemMessage = await translationService.translateToServerLanguage(systemMessageDefinition.message, args);
				console.log({ systemMessage });
				return {
					...message,
					msg: systemMessage,
				};
			}),
		);
	}

	private async parserMessages(
		messages: PDFMessage[],
		dateFormat: string,
		timeAndDateFormat: string,
		timezone: string,
	): Promise<PDFMessage[]> {
		console.log('messages before parse', messages);
		const systemMessagesParsed = await this.parseSystemMessage(messages);
		console.log({ systemMessagesParsed });
		return systemMessagesParsed.map((message, index, arr) => {
			const previousMessage = arr[index - 1];
			const { ts, ...rest } = message;
			const formattedTs = moment(ts).tz(timezone).format(timeAndDateFormat);
			const isDivider = this.isNewDay(message, previousMessage, timezone);
			const formattedQuotes = message.quotes?.length
				? message.quotes.map((quote) => {
						return {
							...quote,
							ts: moment(quote.ts).tz(timezone).format(timeAndDateFormat),
						};
				  })
				: undefined;

			if (isDivider) {
				return {
					...rest,
					ts: formattedTs,
					divider: moment(ts).tz(timezone).format(dateFormat),
					quotes: formattedQuotes,
				};
			}

			return {
				...rest,
				ts: formattedTs,
				quotes: formattedQuotes,
			};
		});
	}

	private getTranslations(translations: Record<string, unknown>[]): (key: string) => unknown {
		return (key: string) => {
			const translation = translations.find((t) => t.key === key);
			if (!translation) {
				throw new Error(`Translation not found for key: ${key}`);
			}
			return translation.value;
		};
	}

	private isChatTranscriptData = (data: any): data is ChatTranscriptData => {
		return (
			'header' in data &&
			'messages' in data &&
			't' in data &&
			'agent' in data.header &&
			'visitor' in data.header &&
			'siteName' in data.header &&
			'date' in data.header &&
			'time' in data.header
		);
	};

	renderTemplate(data: Data): Promise<NodeJS.ReadableStream> {
		if (!this.isChatTranscriptData(data)) {
			throw new Error('Invalid data');
		}
		return exportChatTranscript(data);
	}

	async parseTemplateData(data: Record<string, unknown | unknown[]>): Promise<Data> {
		return {
			header: {
				visitor: data.visitor,
				agent: data.agent,
				siteName: data.siteName,
				date: `${moment(data.closedAt as Date)
					.tz(data.timezone as string)
					.format(String(data.dateFormat))}`,
				time: `${moment(data.closedAt as Date)
					.tz(data.timezone as string)
					.format('H:mm:ss')} ${data.timezone}`,
			},
			messages: Array.isArray(data.messages)
				? await this.parserMessages(data.messages, data.dateFormat as string, data.timeAndDateFormat as string, data.timezone as string)
				: [],
			t: this.getTranslations(data.translations as Record<string, unknown>[]),
		};
	}
}
