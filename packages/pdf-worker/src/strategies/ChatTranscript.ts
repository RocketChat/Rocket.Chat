import moment from 'moment';

import type { Data } from '../types/Data';
import type { IStrategy } from '../types/IStrategy';
import exportChatTranscript from '../templates/ChatTranscript';
import type { ChatTranscriptData, PDFMessage } from '../templates/ChatTranscript';

export class ChatTranscript implements IStrategy {
	private isNewDay(current: PDFMessage, previous: PDFMessage | undefined): boolean {
		return !previous || !moment(current.ts).isSame(previous.ts, 'day');
	}

	private parserMessages(messages: PDFMessage[], dateFormat: unknown, timeAndDateFormat: unknown): unknown[] {
		return messages.map((message, index, arr) => {
			const previousMessage = arr[index - 1];
			const { ts, ...rest } = message;
			const formattedTs = moment(ts).format(String(timeAndDateFormat));
			const isDivider = this.isNewDay(message, previousMessage);

			if (isDivider) {
				return { ...rest, ts: formattedTs, divider: moment(ts).format(String(dateFormat)) };
			}

			return {
				...rest,
				ts: formattedTs,
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

	parseTemplateData(data: Record<string, unknown | unknown[]>): Data {
		return {
			header: {
				visitor: data.visitor,
				agent: data.agent,
				siteName: data.siteName,
				date: `${moment(data.closedAt as Date).format(String(data.dateFormat))}`,
				time: `${moment(data.closedAt as Date).format('H:mm:ss')} ${data.timezone}`,
			},
			messages: Array.isArray(data.messages) ? this.parserMessages(data.messages, data.dateFormat, data.timeAndDateFormat) : [],
			t: this.getTranslations(data.translations as Record<string, unknown>[]),
		};
	}
}
