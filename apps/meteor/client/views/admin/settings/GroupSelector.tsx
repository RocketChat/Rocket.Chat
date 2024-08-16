import type { GroupId } from '@rocket.chat/core-typings';
import { useSettingStructure } from '@rocket.chat/ui-contexts';
import React from 'react';

import GroupPage from './GroupPage';
import AssetsGroupPage from './groups/AssetsGroupPage';
import LDAPGroupPage from './groups/LDAPGroupPage';
import OAuthGroupPage from './groups/OAuthGroupPage';
import TabbedGroupPage from './groups/TabbedGroupPage';
import VoipGroupPage from './groups/VoipGroupPage';

type GroupSelectorProps = {
	groupId: GroupId;
	onClickBack?: () => void;
};

const GroupSelector = ({ groupId, onClickBack }: GroupSelectorProps) => {
	const group = useSettingStructure(groupId);

	if (!group) {
		return <GroupPage.Skeleton />;
	}

	if (groupId === 'Assets') {
		return <AssetsGroupPage {...group} onClickBack={onClickBack} />;
	}

	if (groupId === 'OAuth') {
		return <OAuthGroupPage {...group} onClickBack={onClickBack} />;
	}

	if (groupId === 'LDAP') {
		return <LDAPGroupPage {...group} onClickBack={onClickBack} />;
	}

	if (groupId === 'Call_Center') {
		return <VoipGroupPage {...group} onClickBack={onClickBack} />;
	}

	return <TabbedGroupPage {...group} onClickBack={onClickBack} />;
};

export default GroupSelector;
