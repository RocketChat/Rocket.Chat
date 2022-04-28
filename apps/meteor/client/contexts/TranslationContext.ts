import type keys from '../../packages/rocketchat-i18n/i18n/en.i18n.json';

export {
	TranslationLanguage,
	TranslationContext,
	TranslationContextValue,
	useLanguages,
	useLanguage,
	useLoadLanguage,
	useTranslation,
} from '@rc/ui-contexts';

export { keys };

export type TranslationKey = keyof typeof keys;
