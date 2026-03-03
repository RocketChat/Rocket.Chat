import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import type { i18n } from 'i18next';

import exportChatTranscript from '../templates/ChatTranscript';
import type { ChatTranscriptData, PDFMessage } from '../types/ChatTranscriptData';
import type { IStrategy } from '../types/IStrategy';
import type { MessageData, WorkerData } from '../types/WorkerData';

function formatInTimezone(ts: Date | number, timezone: string, fmt: string): string {
	const d = new TZDate(new Date(ts).getTime(), timezone);
	const y = d.getFullYear();
	const m = d.getMonth();
	const day = d.getDate();
	const h = d.getHours();
	const min = d.getMinutes();
	const s = d.getSeconds();
	const date = new Date(y, m, day, h, min, s);
	if (fmt === 'H:mm:ss') return format(date, 'H:mm:ss');
	return format(date, fmt.replace(/YYYY/g, 'yyyy').replace(/DD/g, 'dd').replace(/D/g, 'd').replace(/MM/g, 'MM').replace(/M/g, 'M'));
}

function isSameDayInTimezone(ts1: Date | number, ts2: Date | number, timezone: string): boolean {
	const d1 = new TZDate(new Date(ts1).getTime(), timezone);
	const d2 = new TZDate(new Date(ts2).getTime(), timezone);
	return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

export class ChatTranscript implements IStrategy {
	private isNewDay(current: MessageData, previous: MessageData | undefined, timezone: string): boolean {
		return !previous || !isSameDayInTimezone(current.ts, previous.ts, timezone);
	}

	private parserMessages(messages: MessageData[], dateFormat: string, timeAndDateFormat: string, timezone: string): PDFMessage[] {
		return messages.map((message, index, arr): PDFMessage => {
			const previousMessage = arr[index - 1];
			const { ts, quotes, requestData, webRtcCallEndTs, ...rest } = message;
			const isDivider = this.isNewDay(message, previousMessage, timezone);

			const formattedTs = formatInTimezone(ts, timezone, timeAndDateFormat);
			const formattedQuotes = quotes?.map((quote) => ({
				...quote,
				ts: quote.ts != null ? formatInTimezone(quote.ts, timezone, timeAndDateFormat) : '',
			}));
			const formattedRequestData = requestData
				? {
						...requestData,
						visitor: requestData.visitor
							? {
									...requestData.visitor,
									ts: formatInTimezone(requestData.visitor.ts, timezone, timeAndDateFormat),
									lastChat: requestData.visitor.lastChat
										? {
												...requestData.visitor.lastChat,
												ts:
													requestData.visitor.lastChat.ts != null
														? formatInTimezone(requestData.visitor.lastChat.ts, timezone, timeAndDateFormat)
														: '',
											}
										: undefined,
									lastAgent: requestData.visitor.lastAgent
										? {
												...requestData.visitor.lastAgent,
												ts:
													requestData.visitor.lastAgent.ts != null
														? formatInTimezone(requestData.visitor.lastAgent.ts, timezone, timeAndDateFormat)
														: '',
											}
										: undefined,
									livechatData: requestData.visitor.livechatData
										? Object.fromEntries(Object.entries(requestData.visitor.livechatData).map(([key]) => [key, null]))
										: undefined,
									_updatedAt: requestData.visitor._updatedAt
										? formatInTimezone(requestData.visitor._updatedAt, timezone, timeAndDateFormat)
										: '',
								}
							: undefined,
					}
				: undefined;
			const formattedWebRtcCallEndTs = webRtcCallEndTs ? formatInTimezone(webRtcCallEndTs, timezone, timeAndDateFormat) : undefined;

			return {
				...rest,
				ts: formattedTs,
				quotes: formattedQuotes,
				requestData: formattedRequestData,
				webRtcCallEndTs: formattedWebRtcCallEndTs,
				...(isDivider && { divider: formatInTimezone(ts, timezone, dateFormat) }),
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
		const closedAt = data.closedAt ?? new Date();
		return {
			header: {
				visitor: data.visitor,
				agent: data.agent,
				siteName: data.siteName,
				date: formatInTimezone(closedAt, data.timezone, String(data.dateFormat)),
				time: `${formatInTimezone(closedAt, data.timezone, 'H:mm:ss')} ${data.timezone}`,
			},
			messages: this.parserMessages(data.messages, data.dateFormat, data.timeAndDateFormat, data.timezone),
			i18n,
		};
	}
}
