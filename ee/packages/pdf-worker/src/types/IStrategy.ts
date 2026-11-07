import type { i18n } from 'i18next';

import type { ChatTranscriptData } from './ChatTranscriptData.js';
import type { WorkerData } from './WorkerData.js';

export interface IStrategy {
	renderTemplate(data: ChatTranscriptData): Promise<NodeJS.ReadableStream>;
	parseTemplateData(data: WorkerData, i18n: i18n): ChatTranscriptData;
}
