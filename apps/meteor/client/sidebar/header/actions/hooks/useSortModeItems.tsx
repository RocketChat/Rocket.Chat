import type { MenuItemIcon } from '@rocket.chat/fuselage';
import { RadioButton } from '@rocket.chat/fuselage';
import { useEndpoint, useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentProps, ReactNode } from 'react';
import React, { useCallback } from 'react';

import { OmnichannelSortingDisclaimer } from '../../../../components/Omnichannel/OmnichannelSortingDisclaimer';
import { useOmnichannelEnterpriseEnabled } from '../../../../hooks/omnichannel/useOmnichannelEnterpriseEnabled';

export type Item = {
	id: string;
	icon?: ComponentProps<typeof MenuItemIcon>['name'];
	name?: string;
	input?: ReactNode;
	content?: ReactNode;
	onClick?: () => void;
	badge?: ReactNode;
};
export const useSortModeItems = (): Item[] => {
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
	const items: Item[] = [
		{
			id: 'activity',
			name: t('Activity'),
			icon: 'clock',
			input: <RadioButton mi='x16' onChange={setToActivity} checked={sidebarSortBy === 'activity'} />,
		},
		{
			id: 'name',
			name: t('Name'),
			icon: 'sort-az',
			input: <RadioButton mi='x16' onChange={setToAlphabetical} checked={sidebarSortBy === 'alphabetical'} />,
		},
	];

	if (isOmnichannelEnabled) {
		items.push(omniDisclaimerItem);
	}

	return items;
};
