import type { IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import moment from 'moment';

import { Users } from '../../app/models/client';
import { settings } from '../../app/settings/client';
import { baseURI } from '../lib/baseURI';
import { changeLanguage, initializeI18n } from '../lib/i18n/i18nHelper';
import { filterLanguage } from '../lib/utils/filterLanguage';
import { isRTLScriptLanguage } from '../lib/utils/isRTLScriptLanguage';

const currentLanguage = new ReactiveVar<string | null>(null);

(async () => {
	await initializeI18n(Meteor._localStorage.getItem('userLanguage') || 'en');
})();

Meteor.startup(async () => {
	currentLanguage.set(Meteor._localStorage.getItem('userLanguage'));

	const availableLanguages = await (await fetch(`${baseURI}i18n/languages/available`)).json();

	const getBrowserLanguage = (): string => filterLanguage(window.navigator.userLanguage ?? window.navigator.language);

	const loadMomentLocale = (language: string): Promise<string> =>
		new Promise((resolve, reject) => {
			if (moment.locales().includes(language.toLowerCase())) {
				resolve(language);
				return;
			}

			Meteor.call('loadLocale', language, (error: unknown, localeSrc: string) => {
				if (error) {
					reject(error);
					return;
				}

				Function(localeSrc).call({ moment });
				resolve(language);
			});
		});

	const applyLanguage = async (language: string | undefined = 'en'): Promise<void> => {
		language = filterLanguage(language);

		if (!availableLanguages[language]) {
			language = language.split('-').shift();
		}

		if (!language) {
			return;
		}
		document.documentElement.classList[isRTLScriptLanguage(language) ? 'add' : 'remove']('rtl');
		document.documentElement.setAttribute('dir', isRTLScriptLanguage(language) ? 'rtl' : 'ltr');
		document.documentElement.lang = language;

		await changeLanguage(language);
		loadMomentLocale(language)
			.then((locale) => moment.locale(locale))
			.catch((error) => {
				moment.locale('en');
				console.error('Error loading moment locale:', error);
			});
	};

	const setLanguage = (language: string): void => {
		const lang = filterLanguage(language);
		currentLanguage.set(lang);
		Meteor._localStorage.setItem('userLanguage', lang);
	};
	window.setLanguage = setLanguage;

	const defaultUserLanguage = (): string => settings.get('Language') || getBrowserLanguage() || 'en';
	window.defaultUserLanguage = defaultUserLanguage;

	Tracker.autorun(async () => {
		const uid = Meteor.userId();
		if (!uid) {
			return;
		}

		const user = Users.findOne(uid, { fields: { language: 1 } }) as IUser | undefined;

		setLanguage(user?.language || defaultUserLanguage());
	});

	Tracker.autorun(async () => {
		const language = currentLanguage.get();
		if (language) {
			await applyLanguage(language);
		}
	});
});
