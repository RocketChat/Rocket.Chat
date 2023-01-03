import moment from 'moment';

import type { Data } from '../types/Data';
import type { IStrategy } from '../types/IStrategy';
import exportTranscript, { isOmnichannelData } from '../templates/transcriptTemplate';

export class OmnichannelPDF implements IStrategy {
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
			body: Array.isArray(data.messages) ? data.messages : [],
			footer: {},
		};
	}
}
