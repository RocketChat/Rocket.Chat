import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

export const getI18n = () => {
	const i18n = i18next.createInstance().use(initReactI18next);

	import('../i18n/en.json').then((translation) => {
		i18n.init({
			fallbackLng: 'en',
			debug: false,
			resources: {
				en: {
					translation,
				},
			},
		});
	});

	return i18n;
};
