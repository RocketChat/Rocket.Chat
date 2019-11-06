import React, { useMemo } from 'react';

import { AssetsGroupPage } from './groups/AssetsGroupPage';
import { OAuthGroupPage } from './groups/OAuthGroupPage';
import { GenericGroupPage } from './groups/GenericGroupPage';
import { useGroup } from './SettingsState';

export function GroupSelector({ groupId }) {
	const group = useGroup(groupId);

	const children = useMemo(() => {
		if (!group) {
			return null;
		}

		return (group._id === 'Assets' && <AssetsGroupPage group={group} />)
			|| (group._id === 'OAuth' && <OAuthGroupPage group={group} />)
			|| <GenericGroupPage group={group} />;
	}, [group]);

	return children;
}
