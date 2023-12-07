import type { WithTranslations } from '../WithTranslations';

export type PlainText = WithTranslations<{
	type: 'plain_text';
	text: string;
	emoji?: boolean;
}>;
