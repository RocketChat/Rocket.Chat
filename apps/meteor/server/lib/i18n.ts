import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import i18nDict from '@rocket.chat/i18n';
import type { TOptions } from 'i18next';

import { availableTranslationNamespaces, defaultTranslationNamespace, extractTranslationNamespaces, i18n } from '../../app/utils/lib/i18n';

void i18n.init({
	lng: 'en',
	defaultNS: defaultTranslationNamespace,
	ns: availableTranslationNamespaces,
	nsSeparator: '.',
	resources: Object.fromEntries(
		Object.entries(i18nDict).map(([language, source]) => [
			language,
			extractTranslationNamespaces(source as unknown as Record<string, string>),
		]),
	),
	initImmediate: false,
});

declare module 'i18next' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface TFunction {
		(key: RocketchatI18nKeys, options?: TOptions): string;
		(key: RocketchatI18nKeys, ...options: unknown[]): string;
		<T>(key: T extends string ? (T extends RocketchatI18nKeys ? T : never) : never, options?: TOptions): string;
	}
}

export { i18n };
