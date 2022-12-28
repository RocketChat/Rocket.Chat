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
				closedAt: data.closedAt,
				timezone: data.timezone,
			},
			body: Array.isArray(data.messages) ? data.messages : [],
			footer: {},
		};
	}
}
