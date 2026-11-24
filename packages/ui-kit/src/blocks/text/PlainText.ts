import type { WithTranslations } from '../WithTranslations.js';

export type PlainText = WithTranslations<{
	type: 'plain_text';
	text: string;
	emoji?: boolean;
}>;
