import React, { FunctionComponent } from 'react';

import { GroupId } from '../../../../definition/ISetting';
import { useSettingStructure } from '../../../contexts/SettingsContext';
import GroupPage from './GroupPage';
import AssetsGroupPage from './groups/AssetsGroupPage';
import LDAPGroupPage from './groups/LDAPGroupPage';
import OAuthGroupPage from './groups/OAuthGroupPage';
import TabbedGroupPage from './groups/TabbedGroupPage';

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

	if (groupId === 'LDAP') {
		return <LDAPGroupPage {...group} />;
	}

	return <TabbedGroupPage {...group} />;
};

export default GroupSelector;
