import React from 'react';
import { Sidebar, Menu, Box, Option } from '@rocket.chat/fuselage';

const Medium = React.memo(({
	icon,
	title = '',
	avatar,
	actions,
	href,
	menuOptions,
	badges,
	unread,
	threadUnread,
	...props
}) => <Sidebar.Item {...props} href={href} clickable={!!href}>
	{avatar && <Box mie='x4'>
		<Sidebar.Item.Avatar>
			{ avatar }
		</Sidebar.Item.Avatar>
	</Box>}
	<Sidebar.Item.Content>
		{ icon }
		<Sidebar.Item.Title className={(unread || threadUnread) && 'rcx-sidebar-item--highlighted'}>{title}</Sidebar.Item.Title>
		{badges}
	</Sidebar.Item.Content>
	<Sidebar.Item.Container>
		{<Sidebar.Item.Actions>
			{ actions }
			{ menuOptions && <Menu
				square
				small
				color='neutral-700'
				options={menuOptions}
				renderItem={({ label: { label, icon }, ...props }) => <Option label={label} title={label} icon={icon} {...props}/>}
			/>}
		</Sidebar.Item.Actions>}
	</Sidebar.Item.Container>
</Sidebar.Item>);

export default Medium;
