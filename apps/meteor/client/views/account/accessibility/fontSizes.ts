import type { SelectOption } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

export const fontSizes = (t: (key: TranslationKey) => string): SelectOption[] => [
	[`${(14 / 16) * 100}%`, t('Font_Small' as TranslationKey)],
	['100%', t('Font_Default' as TranslationKey)],
	[`${(18 / 16) * 100}%`, t('Font_Medium' as TranslationKey)],
	[`${(20 / 16) * 100}%`, t('Font_Large' as TranslationKey)],
	[`${(24 / 16) * 100}%`, t('Font_Extra_large' as TranslationKey)],
];
