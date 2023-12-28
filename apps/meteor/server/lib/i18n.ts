import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import i18nDict from '@rocket.chat/i18n';
import type { TOptions } from 'i18next';

import { i18n } from '../../app/utils/lib/i18n';

void i18n.init({
	lng: 'en',
	defaultNS: 'core',
	resources: Object.fromEntries(Object.entries(i18nDict).map(([key, value]) => [key, { core: value }])),
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

export { i18n };
