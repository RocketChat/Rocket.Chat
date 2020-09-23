import React from 'react';
import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useRoute } from '../../../contexts/RouterContext';

const Directory = () => {
	const directoryRoute = useRoute('directory');
	const handleDirectory = useMutableCallback(() => directoryRoute.push({}));

	return <Sidebar.TopBar.Action icon='globe' onClick={handleDirectory}/>;
};

export default Directory;
