import i18next from 'i18next';
import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import i18nDict from '@rocket.chat/i18n';
import sprintf from 'i18next-sprintf-postprocessor';

void i18next.use(sprintf).init({
	compatibilityJSON: 'v1',
	lng: 'en',
	interpolation: {
		prefix: '__',
		suffix: '__',
	},
	resources: Object.fromEntries(Object.entries(i18nDict).map(([key, value]) => [key, { translation: value }])),
	initImmediate: true,
});

declare module 'i18next' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface TFunction {
		(key: RocketchatI18nKeys, options?: TOptions): string;
		(key: RocketchatI18nKeys, ...options: unknown[]): string;
		<T>(key: T extends string ? (T extends RocketchatI18nKeys ? T : never) : never, options?: TOptions): string;
	}
}

export { i18next as i18n };
