import { RadioButton } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
	OmnichannelSortingDisclaimer,
	useOmnichannelSortingDisclaimer,
} from '../../../components/Omnichannel/OmnichannelSortingDisclaimer';

export const useSortModeItems = (): GenericMenuItemProps[] => {
	const { t } = useTranslation();

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');
	const sidebarSortBy = useUserPreference<'activity' | 'alphabetical'>('sidebarSortby', 'activity');
	const isOmnichannelEnabled = useOmnichannelSortingDisclaimer();

	const useHandleChange = (value: 'alphabetical' | 'activity'): (() => void) =>
		useCallback(() => saveUserPreferences({ data: { sidebarSortby: value } }), [value]);

	const setToAlphabetical = useHandleChange('alphabetical');
	const setToActivity = useHandleChange('activity');

	return [
		{
			id: 'activity',
			content: t('Activity'),
			icon: 'clock',
			addon: <RadioButton onChange={setToActivity} checked={sidebarSortBy === 'activity'} />,
			description: sidebarSortBy === 'activity' && isOmnichannelEnabled && <OmnichannelSortingDisclaimer />,
		},
		{
			id: 'name',
			content: t('Name'),
			icon: 'sort-az',
			addon: <RadioButton onChange={setToAlphabetical} checked={sidebarSortBy === 'alphabetical'} />,
			description: sidebarSortBy === 'alphabetical' && isOmnichannelEnabled && <OmnichannelSortingDisclaimer />,
		},
	];
};
