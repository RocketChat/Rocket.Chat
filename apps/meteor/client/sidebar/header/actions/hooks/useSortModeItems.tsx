import { RadioButton } from '@rocket.chat/fuselage';
import { useEndpoint, useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import type { GenericMenuItemProps } from '../../../../components/GenericMenuItem';
import { OmnichannelSortingDisclaimer } from '../../../../components/Omnichannel/OmnichannelSortingDisclaimer';
import { useOmnichannelEnterpriseEnabled } from '../../../../hooks/omnichannel/useOmnichannelEnterpriseEnabled';

export const useSortModeItems = (): GenericMenuItemProps[] => {
	const t = useTranslation();

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');
	const sidebarSortBy = useUserPreference<'activity' | 'alphabetical'>('sidebarSortby', 'activity');
	const isOmnichannelEnabled = useOmnichannelEnterpriseEnabled();

	const omniDisclaimerItem = {
		id: 'sortByList',
		content: <OmnichannelSortingDisclaimer id='sortByList' />,
	};

	const useHandleChange = (value: 'alphabetical' | 'activity'): (() => void) =>
		useCallback(() => saveUserPreferences({ data: { sidebarSortby: value } }), [value]);

	const setToAlphabetical = useHandleChange('alphabetical');
	const setToActivity = useHandleChange('activity');
	const items: GenericMenuItemProps[] = [
		{
			id: 'activity',
			content: t('Activity'),
			icon: 'clock',
			addon: <RadioButton mi='x16' onChange={setToActivity} checked={sidebarSortBy === 'activity'} />,
		},
		{
			id: 'name',
			content: t('Name'),
			icon: 'sort-az',
			addon: <RadioButton mi='x16' onChange={setToAlphabetical} checked={sidebarSortBy === 'alphabetical'} />,
		},
	];

	if (isOmnichannelEnabled) {
		items.push(omniDisclaimerItem);
	}

	return items;
};
