import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import { addSprinfToI18n } from '@rocket.chat/i18n/dist/utils';
import type { TOptions } from 'i18next';
import i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';

declare module 'i18next' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface TFunction {
		(key: RocketchatI18nKeys): string;
		(key: RocketchatI18nKeys, options: TOptions): string;
	}
}

export const i18n = i18next.use(sprintf);

export const t = addSprinfToI18n(i18n.t.bind(i18n));
