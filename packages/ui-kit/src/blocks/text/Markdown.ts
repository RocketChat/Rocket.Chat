import type { WithTranslations } from '../WithTranslations.js';

export type Markdown = WithTranslations<{
	type: 'mrkdwn';
	text: string;
	verbatim?: boolean;
}>;
