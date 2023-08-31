import { RadioButton } from '@rocket.chat/fuselage';
import { useEndpoint, useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';
import {
	OmnichannelSortingDisclaimer,
	useOmnichannelSortingDisclaimer,
} from '../../../../components/Omnichannel/OmnichannelSortingDisclaimer';

export const useSortModeItems = (): GenericMenuItemProps[] => {
	const t = useTranslation();

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
			addon: <RadioButton mi={16} onChange={setToActivity} checked={sidebarSortBy === 'activity'} />,
			description: sidebarSortBy === 'activity' && isOmnichannelEnabled && <OmnichannelSortingDisclaimer />,
		},
		{
			id: 'name',
			content: t('Name'),
			icon: 'sort-az',
			addon: <RadioButton mi={16} onChange={setToAlphabetical} checked={sidebarSortBy === 'alphabetical'} />,
			description: sidebarSortBy === 'alphabetical' && isOmnichannelEnabled && <OmnichannelSortingDisclaimer />,
		},
	];
};
