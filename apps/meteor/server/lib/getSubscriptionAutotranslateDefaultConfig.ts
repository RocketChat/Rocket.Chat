import type { IUser } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

export const getSubscriptionAutotranslateDefaultConfig = async (
	user: IUser,
): Promise<
	| {
			autoTranslate: boolean;
			autoTranslateLanguage: string;
	  }
	| undefined
> => {
	const [autoEnableSetting, languageSetting] = await Promise.all([
		Settings.findOneById('AutoTranslate_AutoEnableOnJoinRoom'),
		Settings.findOneById('Language'),
	]);
	const { language: userLanguage } = user.settings?.preferences || {};

	if (!autoEnableSetting?.value) {
		return;
	}

	if (!userLanguage || userLanguage === 'default' || languageSetting?.value === userLanguage) {
		return;
	}

	return { autoTranslate: true, autoTranslateLanguage: userLanguage };
};
