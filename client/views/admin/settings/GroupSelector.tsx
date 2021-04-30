import React, { FunctionComponent } from 'react';

import { GroupId } from '../../../../definition/ISetting';
import { useSettingStructure } from '../../../contexts/SettingsContext';
import GroupPage from './GroupPage';
import AssetsGroupPage from './groups/AssetsGroupPage';
import GenericGroupPage from './groups/GenericGroupPage';
import OAuthGroupPage from './groups/OAuthGroupPage';

type GroupSelectorProps = {
	groupId: GroupId;
};

const GroupSelector: FunctionComponent<GroupSelectorProps> = ({ groupId }) => {
	const group = useSettingStructure(groupId);

	if (!group) {
		return <GroupPage.Skeleton />;
	}

	if (groupId === 'Assets') {
		return <AssetsGroupPage {...group} />;
	}

	if (groupId === 'OAuth') {
		return <OAuthGroupPage {...group} />;
	}

	return <GenericGroupPage {...group} />;
};

export default GroupSelector;
