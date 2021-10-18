import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React from 'react';

import { useLayout } from '../../../contexts/LayoutContext';
import { useRoute } from '../../../contexts/RouterContext';

const Directory = (props) => {
	const directoryRoute = useRoute('directory');
	const { sidebar } = useLayout();
	const handleDirectory = useMutableCallback(() => {
		sidebar.toggle();
		directoryRoute.push({});
	});

	return <Sidebar.TopBar.Action {...props} icon='globe' onClick={handleDirectory} />;
};

export default Directory;
