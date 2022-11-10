import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { TooltipWrapper } from '@rocket.chat/layout';
import { useCurrentRoute, useLayout, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement } from 'react';

import { useRoomList } from '../hooks/useRoomList';

const UnreadsSection = (props: typeof Box): ReactElement => {
	const t = useTranslation();
	const { sidebar } = useLayout();
	const directoryRoute = useRoute('unreads');
	const handleRoute = useMutableCallback(() => {
		sidebar.toggle();
		directoryRoute.push({});
	});

	const rooms = useRoomList();
	const hasUnreadMessages = rooms.filter((room) => room?.unread || room?.tunread?.length)?.length > 0;

	const currentRoute = useCurrentRoute();
	const [currentRouteName] = currentRoute;
	const isActive = currentRouteName === 'unreads';

	const color = hasUnreadMessages ? '#ffffff' : '#9ea2a8';
	const tooltip = 'You have new messages!';

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
				<Sidebar.TopBar.Title>
					<Box color={color}>{t('Unread_Messages')}</Box>
				</Sidebar.TopBar.Title>
				{hasUnreadMessages && (
					<Sidebar.TopBar.Actions>
						<TooltipWrapper text={tooltip}>
							<Icon size='x20' name='bell' color={color} />
						</TooltipWrapper>
					</Sidebar.TopBar.Actions>
				)}
			</Sidebar.TopBar.ToolBox>
		</Box>
	);
};

export default Object.assign(memo(UnreadsSection), {
	size: 56,
});
