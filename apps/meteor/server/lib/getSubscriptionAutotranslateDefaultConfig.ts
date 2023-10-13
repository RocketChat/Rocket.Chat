import type { AtLeast, IUser } from '@rocket.chat/core-typings';

import { settings } from '../../app/settings/server';

export function getSubscriptionAutotranslateDefaultConfig(user: AtLeast<IUser, 'settings'>):
	| {
			autoTranslate: boolean;
			autoTranslateLanguage: string;
	  }
	| undefined {
	if (!settings.get('AutoTranslate_AutoEnableOnJoinRoom')) {
		return;
	}

	const languageSetting = settings.get('Language');

	const { language: userLanguage } = user.settings?.preferences || {};
	if (!userLanguage || userLanguage === 'default' || languageSetting === userLanguage) {
		return;
	}

	return { autoTranslate: true, autoTranslateLanguage: userLanguage };
}
