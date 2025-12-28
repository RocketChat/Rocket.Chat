import { availableTranslationNamespaces, defaultTranslationNamespace, extractTranslationNamespaces } from '@rocket.chat/i18n';
import languages from '@rocket.chat/i18n/dist/languages';

import { i18n } from '../../app/utils/lib/i18n';

// Meteor bundler is incredible (derogatory)
// eslint-disable-next-line no-constant-condition
if (false) {
	// @ts-expect-error unreachable code
	import('@rocket.chat/i18n/dist/resources/af.i18n.json');
	import('@rocket.chat/i18n/dist/resources/ar.i18n.json');
	import('@rocket.chat/i18n/dist/resources/az.i18n.json');
	import('@rocket.chat/i18n/dist/resources/be-BY.i18n.json');
	import('@rocket.chat/i18n/dist/resources/bg.i18n.json');
	import('@rocket.chat/i18n/dist/resources/bn-BD.i18n.json');
	import('@rocket.chat/i18n/dist/resources/bn-IN.i18n.json');
	import('@rocket.chat/i18n/dist/resources/bs.i18n.json');
	import('@rocket.chat/i18n/dist/resources/ca.i18n.json');
	import('@rocket.chat/i18n/dist/resources/cs.i18n.json');
	import('@rocket.chat/i18n/dist/resources/cy.i18n.json');
	import('@rocket.chat/i18n/dist/resources/da.i18n.json');
	import('@rocket.chat/i18n/dist/resources/de-AT.i18n.json');
	import('@rocket.chat/i18n/dist/resources/de-IN.i18n.json');
	import('@rocket.chat/i18n/dist/resources/de.i18n.json');
	import('@rocket.chat/i18n/dist/resources/el.i18n.json');
	import('@rocket.chat/i18n/dist/resources/en.i18n.json');
	import('@rocket.chat/i18n/dist/resources/eo.i18n.json');
	import('@rocket.chat/i18n/dist/resources/es.i18n.json');
	import('@rocket.chat/i18n/dist/resources/et.i18n.json');
	import('@rocket.chat/i18n/dist/resources/eu.i18n.json');
	import('@rocket.chat/i18n/dist/resources/fa.i18n.json');
	import('@rocket.chat/i18n/dist/resources/fi.i18n.json');
	import('@rocket.chat/i18n/dist/resources/fr.i18n.json');
	import('@rocket.chat/i18n/dist/resources/gl.i18n.json');
	import('@rocket.chat/i18n/dist/resources/he.i18n.json');
	import('@rocket.chat/i18n/dist/resources/hi-IN.i18n.json');
	import('@rocket.chat/i18n/dist/resources/hi.i18n.json');
	import('@rocket.chat/i18n/dist/resources/hr.i18n.json');
	import('@rocket.chat/i18n/dist/resources/hu.i18n.json');
	import('@rocket.chat/i18n/dist/resources/id.i18n.json');
	import('@rocket.chat/i18n/dist/resources/it.i18n.json');
	import('@rocket.chat/i18n/dist/resources/ja.i18n.json');
	import('@rocket.chat/i18n/dist/resources/ka-GE.i18n.json');
	import('@rocket.chat/i18n/dist/resources/km.i18n.json');
	import('@rocket.chat/i18n/dist/resources/ko.i18n.json');
	import('@rocket.chat/i18n/dist/resources/ku.i18n.json');
	import('@rocket.chat/i18n/dist/resources/lo.i18n.json');
	import('@rocket.chat/i18n/dist/resources/lt.i18n.json');
	import('@rocket.chat/i18n/dist/resources/lv.i18n.json');
	import('@rocket.chat/i18n/dist/resources/mn.i18n.json');
	import('@rocket.chat/i18n/dist/resources/ms-MY.i18n.json');
	import('@rocket.chat/i18n/dist/resources/nb.i18n.json');
	import('@rocket.chat/i18n/dist/resources/nl.i18n.json');
	import('@rocket.chat/i18n/dist/resources/nn.i18n.json');
	import('@rocket.chat/i18n/dist/resources/pa-IN.i18n.json');
	import('@rocket.chat/i18n/dist/resources/pl.i18n.json');
	import('@rocket.chat/i18n/dist/resources/pt-BR.i18n.json');
	import('@rocket.chat/i18n/dist/resources/pt.i18n.json');
	import('@rocket.chat/i18n/dist/resources/ro.i18n.json');
	import('@rocket.chat/i18n/dist/resources/ru.i18n.json');
	import('@rocket.chat/i18n/dist/resources/se.i18n.json');
	import('@rocket.chat/i18n/dist/resources/si.i18n.json');
	import('@rocket.chat/i18n/dist/resources/sk-SK.i18n.json');
	import('@rocket.chat/i18n/dist/resources/sl-SI.i18n.json');
	import('@rocket.chat/i18n/dist/resources/sq.i18n.json');
	import('@rocket.chat/i18n/dist/resources/sr.i18n.json');
	import('@rocket.chat/i18n/dist/resources/sv.i18n.json');
	import('@rocket.chat/i18n/dist/resources/ta-IN.i18n.json');
	import('@rocket.chat/i18n/dist/resources/th-TH.i18n.json');
	import('@rocket.chat/i18n/dist/resources/tr.i18n.json');
	import('@rocket.chat/i18n/dist/resources/ug.i18n.json');
	import('@rocket.chat/i18n/dist/resources/uk.i18n.json');
	import('@rocket.chat/i18n/dist/resources/vi-VN.i18n.json');
	import('@rocket.chat/i18n/dist/resources/zh-HK.i18n.json');
	import('@rocket.chat/i18n/dist/resources/zh-TW.i18n.json');
	import('@rocket.chat/i18n/dist/resources/zh.i18n.json');
}

void i18n.init({
	lng: 'en',
	fallbackLng: 'en',
	defaultNS: defaultTranslationNamespace,
	ns: availableTranslationNamespaces,
	nsSeparator: '.',
	resources: Object.fromEntries(
		languages.map((language) => [
			language,
			extractTranslationNamespaces(
				// TODO: commonjs is terrible but we don't have esm build yet
				// eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-dynamic-require
				require(`@rocket.chat/i18n/dist/resources/${language}.i18n.json`) as unknown as Record<string, string>,
			),
		]),
	),
	initImmediate: false,
});

export { i18n };
