import i18nDict from '@rocket.chat/i18n';
import i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';

export const i18n = i18next.use(sprintf);

void i18n.init({
	lng: 'en',
	defaultNS: 'core',
	resources: Object.fromEntries(Object.entries(i18nDict).map(([key, value]) => [key, { core: value }])),
	initImmediate: true,
});
