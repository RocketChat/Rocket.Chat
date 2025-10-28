import type { WithTranslations } from '../WithTranslations';

export type Markdown = WithTranslations<{
	type: 'mrkdwn';
	text: string;
	verbatim?: boolean;
}>;
