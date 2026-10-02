import type { ISetting } from '@rocket.chat/core-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { TFunction } from 'i18next';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type OrganizationOption = [key: string, text: string];

export type OrganizationOptions = {
	country: OrganizationOption[];
	industry: OrganizationOption[];
	size: OrganizationOption[];
};

const getSettingOptions = (settings: ISetting[] | undefined, settingId: ISetting['_id'], t: TFunction): OrganizationOption[] => {
	const setting = settings?.find(({ _id }) => _id === settingId);

	if (!setting?.values) {
		return [];
	}

	return setting.values.map(({ i18nLabel, key }) => [String(key), t(i18nLabel as TranslationKey)]);
};

/** Turns the settings the wizard fetched into the choices an organization page offers, so no page has to know the setting ids. */
export const useOrganizationOptions = (settings: ISetting[] | undefined): OrganizationOptions => {
	const { t } = useTranslation();

	return useMemo(
		() => ({
			country: getSettingOptions(settings, 'Country', t),
			industry: getSettingOptions(settings, 'Industry', t),
			size: getSettingOptions(settings, 'Size', t),
		}),
		[settings, t],
	);
};
