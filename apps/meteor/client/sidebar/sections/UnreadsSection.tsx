import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { TooltipWrapper } from '@rocket.chat/layout';
import { useCurrentRoute, useLayout, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement } from 'react';

import { useUnreadRoomList } from '../../views/unreads/hooks/useUnreadRoomList';

const UnreadsSection = (props: typeof Box): ReactElement => {
	const t = useTranslation();
	const { sidebar } = useLayout();
	const directoryRoute = useRoute('unreads');
	const handleRoute = useMutableCallback(() => {
		sidebar.toggle();
		directoryRoute.push({});
	});

	const rooms = useUnreadRoomList();
	const hasUnreadMessages = rooms?.length > 0;

	const currentRoute = useCurrentRoute();
	const [currentRouteName] = currentRoute;
	const isActive = currentRouteName === 'unreads';

	const color = hasUnreadMessages ? 'var(--color-white)' : 'var(--color-gray)';

	const sidebarItemStyles = css`
		cursor: pointer;
		background-color: ${isActive ? 'var(--color-dark-medium)' : 'var(--color-dark)'} !important;
		&:hover,
		&:focus {
			background-color: var(--color-darkest) !important;
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
						<TooltipWrapper text={t('You_have_new_messages')}>
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
