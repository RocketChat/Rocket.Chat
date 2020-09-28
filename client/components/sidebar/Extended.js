import React from 'react';
import { Sidebar, Menu, Box, Option } from '@rocket.chat/fuselage';

import { useFormatTime } from '../../hooks/useFormatTime';

const Extended = React.memo(({
	icon,
	title = '',
	avatar,
	actions,
	href,
	time,
	menu,
	menuOptions,
	subtitle = '',
	badges,
	threadUnread,
	unread,
	...props
}) => {
	const formatDate = useFormatTime();

	return <Sidebar.Item highlighted={unread} {...props} href={href} clickable={!!href}>
		{ avatar && <Box mie='x4'>
			<Sidebar.Item.Avatar>
				{ avatar }
			</Sidebar.Item.Avatar>
		</Box>}
		<Sidebar.Item.Content>
			<Box display='flex' alignItems='stretch' flexDirection='column' w='full'>
				<Sidebar.Item.Wrapper>
					{ icon }
					<Sidebar.Item.Title className={unread && 'rcx-sidebar-item--highlighted'}>
						{ title }
					</Sidebar.Item.Title>
					{time && <Sidebar.Item.Time>{formatDate(time)}</Sidebar.Item.Time>}
				</Sidebar.Item.Wrapper>

				<Sidebar.Item.Wrapper>
					<Sidebar.Item.Subtitle className={(unread || threadUnread) && 'rcx-sidebar-item--highlighted'}>
						{ subtitle }
					</Sidebar.Item.Subtitle>
					{badges}
				</Sidebar.Item.Wrapper>
			</Box>
		</Sidebar.Item.Content>
		{ actions && <Sidebar.Item.Container>
			{<Sidebar.Item.Actions>
				{ actions }
			</Sidebar.Item.Actions>}
		</Sidebar.Item.Container>
		}
		{menu && <Sidebar.Item.Menu>{menu}</Sidebar.Item.Menu>}
	</Sidebar.Item>;
});

export default Extended;
