import type { i18n } from 'i18next';
import moment from 'moment-timezone';

import exportChatTranscript from '../templates/ChatTranscript';
import type { ChatTranscriptData, PDFMessage } from '../types/ChatTranscriptData';
import type { IStrategy } from '../types/IStrategy';
import type { MessageData, WorkerData } from '../types/WorkerData';

export class ChatTranscript implements IStrategy {
	private isNewDay(current: MessageData, previous: MessageData | undefined, timezone: string): boolean {
		return !previous || !moment(current.ts).tz(timezone).isSame(previous.ts, 'day');
	}

	private parserMessages(messages: MessageData[], dateFormat: string, timeAndDateFormat: string, timezone: string): PDFMessage[] {
		return messages.map((message, index, arr): PDFMessage => {
			const previousMessage = arr[index - 1];
			const { ts, quotes, requestData, webRtcCallEndTs, ...rest } = message;
			const isDivider = this.isNewDay(message, previousMessage, timezone);

			const formattedTs = moment(ts).tz(timezone).format(timeAndDateFormat);
			const formattedQuotes = quotes?.map((quote) => ({
				...quote,
				ts: moment(quote.ts).tz(timezone).format(timeAndDateFormat),
			}));
			const formattedRequestData = requestData
				? {
						...requestData,
						visitor: requestData.visitor
							? {
									...requestData.visitor,
									ts: moment(requestData.visitor.ts).tz(timezone).format(timeAndDateFormat),
									lastChat: requestData.visitor.lastChat
										? {
												...requestData.visitor.lastChat,
												ts: moment(requestData.visitor.lastChat.ts).tz(timezone).format(timeAndDateFormat),
											}
										: undefined,
									lastAgent: requestData.visitor.lastAgent
										? {
												...requestData.visitor.lastAgent,
												ts: moment(requestData.visitor.lastAgent.ts).tz(timezone).format(timeAndDateFormat),
											}
										: undefined,
									livechatData: requestData.visitor.livechatData
										? Object.fromEntries(Object.entries(requestData.visitor.livechatData).map(([key]) => [key, null]))
										: undefined,
									_updatedAt: requestData.visitor._updatedAt
										? moment(requestData.visitor._updatedAt).tz(timezone).format(timeAndDateFormat)
										: '',
								}
							: undefined,
					}
				: undefined;
			const formattedWebRtcCallEndTs = webRtcCallEndTs ? moment(webRtcCallEndTs).tz(timezone).format(timeAndDateFormat) : undefined;

			return {
				...rest,
				ts: formattedTs,
				quotes: formattedQuotes,
				requestData: formattedRequestData,
				webRtcCallEndTs: formattedWebRtcCallEndTs,
				...(isDivider && { divider: moment(ts).tz(timezone).format(dateFormat) }),
			};
		});
	}

	private isChatTranscriptData = (data: unknown): data is ChatTranscriptData => {
		return (
			typeof data === 'object' &&
			data !== null &&
			'header' in data &&
			'messages' in data &&
			'i18n' in data &&
			typeof data.header === 'object' &&
			data.header !== null &&
			'agent' in data.header &&
			'visitor' in data.header &&
			'siteName' in data.header &&
			'date' in data.header &&
			'time' in data.header
		);
	};

	renderTemplate(data: ChatTranscriptData): Promise<NodeJS.ReadableStream> {
		if (!this.isChatTranscriptData(data)) {
			throw new Error('Invalid data');
		}
		return exportChatTranscript(data);
	}

	parseTemplateData(data: WorkerData, i18n: i18n): ChatTranscriptData {
		return {
			header: {
				visitor: data.visitor,
				agent: data.agent,
				siteName: data.siteName,
				date: `${moment(data.closedAt).tz(data.timezone).format(String(data.dateFormat))}`,
				time: `${moment(data.closedAt).tz(data.timezone).format('H:mm:ss')} ${data.timezone}`,
			},
			messages: this.parserMessages(data.messages, data.dateFormat, data.timeAndDateFormat, data.timezone),
			i18n,
		};
	}
}
