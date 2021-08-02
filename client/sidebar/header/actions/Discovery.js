import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { useRoute } from '../../../contexts/RouterContext';
import { useSetting } from '../../../contexts/SettingsContext';

const Discovery = (props) => {
	const discoveryRoute = useRoute('discovery');
	const showDiscovery = useSetting('Discovery_Enabled');
	const handleDiscovery = useMutableCallback(() => discoveryRoute.push({}));

	return showDiscovery ? (
		<Sidebar.TopBar.Action {...props} icon='hash' onClick={handleDiscovery} />
	) : null;
};

export default Discovery;
