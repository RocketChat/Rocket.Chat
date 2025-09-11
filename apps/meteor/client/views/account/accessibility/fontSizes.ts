import type { SelectOption } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

type TranslationFunction = (key: TranslationKey) => string;

export const fontSizes = (t: TranslationFunction): SelectOption[] => [
	[`${(14 / 16) * 100}%`, t('Font_Small')],
	['100%', t('Font_Default')],
	[`${(18 / 16) * 100}%`, t('Font_Medium')],
	[`${(20 / 16) * 100}%`, t('Font_Large')],
	[`${(24 / 16) * 100}%`, t('Font_Extra_large')],
];
