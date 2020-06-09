import React from 'react';

import { usePrivateSettingsGroup } from '../../contexts/PrivateSettingsContext';
import { AssetsGroupPage } from './groups/AssetsGroupPage';
import { OAuthGroupPage } from './groups/OAuthGroupPage';
import { GenericGroupPage } from './groups/GenericGroupPage';
import { GroupPage } from './GroupPage';

export function GroupSelector({ groupId }) {
	const group = usePrivateSettingsGroup(groupId);

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
}
