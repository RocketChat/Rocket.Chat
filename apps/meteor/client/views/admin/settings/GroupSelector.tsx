import { GroupId } from '@rocket.chat/core-typings';
import { useSettingStructure } from '@rocket.chat/ui-contexts';
import React, { FunctionComponent } from 'react';

import GroupPage from './GroupPage';
import AssetsGroupPage from './groups/AssetsGroupPage';
import LDAPGroupPage from './groups/LDAPGroupPage';
import OAuthGroupPage from './groups/OAuthGroupPage';
import TabbedGroupPage from './groups/TabbedGroupPage';
import VoipGroupPage from './groups/VoipGroupPage';

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

	if (groupId === 'Call_Center') {
		return <VoipGroupPage {...group} />;
	}

	return <TabbedGroupPage {...group} />;
};

export default GroupSelector;
