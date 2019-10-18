import React from 'react';

import { AssetsGroupPage } from './groups/AssetsGroupPage';
import { OAuthGroupPage } from './groups/OAuthGroupPage';
import { GenericGroupPage } from './groups/GenericGroupPage';
import { useGroup } from './EditingState';

export function GroupSelector() {
	const group = useGroup();

	if (!group) {
		return null;
	}

	if (group._id === 'Assets') {
		return <AssetsGroupPage />;
	}

	if (group._id === 'OAuth') {
		return <OAuthGroupPage />;
	}

	return <GenericGroupPage />;
}
