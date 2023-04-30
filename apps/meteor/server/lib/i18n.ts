import i18next from 'i18next';
import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import i18nDict from '@rocket.chat/i18n';

void i18next.init({
	lng: 'en',
	debug: true,
	resources: Object.fromEntries(Object.entries(i18nDict).map(([key, value]) => [key, { translation: value }])),
	initImmediate: true,
});

declare module 'i18next' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface TFunction {
		(key: RocketchatI18nKeys, options?: TOptions): string;
		<T>(key: T extends string ? (T extends RocketchatI18nKeys ? T : never) : never, options?: TOptions): string;
	}
}

export { i18next as i18n };
