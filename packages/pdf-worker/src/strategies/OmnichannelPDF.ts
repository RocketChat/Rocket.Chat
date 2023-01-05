import moment from 'moment';

import type { Data } from '../types/Data';
import type { IStrategy } from '../types/IStrategy';
import type { PDFMessage } from '../templates/transcriptTemplate';
import exportTranscript, { isOmnichannelData } from '../templates/transcriptTemplate';

export class OmnichannelPDF implements IStrategy {
	private isNewDay(current: PDFMessage, previous: PDFMessage | undefined): boolean {
		return !previous || !moment(current.ts).isSame(previous.ts, 'day');
	}

	private parserBody(messages: PDFMessage[], dateFormat: unknown, timeAndDateFormat: unknown): unknown[] {
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

	renderTemplate(data: Data): Promise<NodeJS.ReadableStream> {
		if (!isOmnichannelData(data)) {
			throw new Error('Invalid data');
		}
		return exportTranscript(data);
	}

	parseTemplateData(data: Record<string, unknown | unknown[]>): Data {
		return {
			header: {
				visitor: data.visitor,
				agent: data.agent,
				siteName: data.siteName,
				date: moment(data.closedAt as Date).format(String(data.dateFormat)),
				time: `${moment(data.closedAt as Date).format('H:mm:ss')} ${data.timezone}`,
			},
			dateFormat: data.dateFormat,
			timeAndDateFormat: data.timeAndDateFormat,
			body: Array.isArray(data.messages) ? this.parserBody(data.messages, data.dateFormat, data.timeAndDateFormat) : [],
			footer: {},
		};
	}
}
