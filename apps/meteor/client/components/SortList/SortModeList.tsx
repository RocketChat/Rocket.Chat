import { RadioButton, OptionTitle } from '@rocket.chat/fuselage';
import { useUserPreference, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import { useOmnichannelEnterpriseEnabled } from '../../hooks/omnichannel/useOmnichannelEnterpriseEnabled';
import { OmnichannelSortingDisclaimer } from '../Omnichannel/OmnichannelSortingDisclaimer';
import ListItem from '../Sidebar/ListItem';

function SortModeList(): ReactElement {
	const t = useTranslation();
	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');
	const sidebarSortBy = useUserPreference<'activity' | 'alphabetical'>('sidebarSortby', 'activity');
	const isOmnichannelEnabled = useOmnichannelEnterpriseEnabled();

	const useHandleChange = (value: 'alphabetical' | 'activity'): (() => void) =>
		useCallback(() => saveUserPreferences({ data: { sidebarSortby: value } }), [value]);

	const setToAlphabetical = useHandleChange('alphabetical');
	const setToActivity = useHandleChange('activity');

	return (
		<>
			<OptionTitle>{t('Sort_By')}</OptionTitle>
			<ul>
				<ListItem
					is='label'
					role='listitem'
					icon='clock'
					text={t('Activity')}
					input={<RadioButton mi='x16' onChange={setToActivity} checked={sidebarSortBy === 'activity'} />}
				/>
				<ListItem
					is='label'
					role='listitem'
					icon='sort-az'
					text={t('Name')}
					input={<RadioButton mi='x16' name='sidebarSortby' onChange={setToAlphabetical} checked={sidebarSortBy === 'alphabetical'} />}
				/>
			</ul>
			{isOmnichannelEnabled && <OmnichannelSortingDisclaimer id='sortByList' />}
		</>
	);
}

export default SortModeList;
