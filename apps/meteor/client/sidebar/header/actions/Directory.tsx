import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useLayout, useRoute } from '@rocket.chat/ui-contexts';
import type { HTMLAttributes, VFC } from 'react';
import React from 'react';

const Directory: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const directoryRoute = useRoute('directory');
	const { sidebar } = useLayout();
	const handleDirectory = useMutableCallback(() => {
		sidebar.toggle();
		directoryRoute.push({});
	});

	return <Sidebar.TopBar.Action {...props} icon='notebook-hashtag' onClick={handleDirectory} />;
};

export default Directory;
