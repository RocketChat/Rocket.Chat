import { css } from '@rocket.chat/css-in-js';
import { Box, Sidebar, Badge } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement } from 'react';

import { useRoomList } from '../hooks/useRoomList';

const UnreadsSection = (props: typeof Box): ReactElement => {
	const directoryRoute = useRoute('unreads');
	const handleRoute = useMutableCallback(() => {
		directoryRoute.push({});
	});

	const roomsList = useRoomList();
	const totalUnreads = roomsList.reduce((prev, cur) => prev + (cur.unread || 0) + (cur?.tunread?.length || 0), 0);
	const badges = (
		<Badge {...({ style: { flexShrink: 0, cursor: 'pointer' } } as any)} variant='ghost'>
			{totalUnreads}
		</Badge>
	);

	const currentRoute = useCurrentRoute();
	const [currentRouteName] = currentRoute;
	const isActive = currentRouteName === 'unreads';

	// TODO import colors from useSidebarPaletteColor
	const sidebarItemStyles = css`
		cursor: pointer;
		background-color: ${isActive ? '#414852' : '#2f343d'} !important;
		&:hover,
		&:focus {
			background-color: #1f2329 !important;
		}
	`;

	return (
		<Box className={sidebarItemStyles} onClick={(): void => handleRoute()}>
			<Sidebar.TopBar.ToolBox {...props}>
				<Sidebar.TopBar.Title>{'Unreads'}</Sidebar.TopBar.Title>
				<Sidebar.TopBar.Actions>{badges}</Sidebar.TopBar.Actions>
			</Sidebar.TopBar.ToolBox>
		</Box>
	);
};

export default Object.assign(memo(UnreadsSection), {
	size: 56,
});
