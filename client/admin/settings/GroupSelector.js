import React, { useMemo } from 'react';

import { useSettingStructure } from '../../contexts/SettingsContext';
import AssetsGroupPage from './groups/AssetsGroupPage';
import OAuthGroupPage from './groups/OAuthGroupPage';
import GenericGroupPage from './groups/GenericGroupPage';
import GroupPage from './GroupPage';
import { useEditableSettings } from '../../contexts/EditableSettingsContext';

const GroupSelector = ({ groupId }) => {
	const group = useSettingStructure(groupId);
	const query = useMemo(() => ({ group: groupId }), [groupId]);
	const editableSettings = useEditableSettings(query);
	const sections = useMemo(
		() => Array.from(new Set(editableSettings.map(({ section }) => section))),
		[editableSettings],
	);

	if (!group) {
		return <GroupPage.Skeleton />;
	}

	if (groupId === 'Assets') {
		return <AssetsGroupPage
			{...group}
			sections={sections}
		/>;
	}

	if (groupId === 'OAuth') {
		return <OAuthGroupPage
			{...group}
			sections={sections}
		/>;
	}

	return <GenericGroupPage
		{...group}
		sections={sections}
	/>;
};

export default GroupSelector;
