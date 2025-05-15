import { addSprinfToI18n } from '@rocket.chat/i18n';
import i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';

export const i18n = i18next.use(sprintf);
export const t = addSprinfToI18n(i18n.t.bind(i18n));
