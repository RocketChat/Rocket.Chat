import React, { useState } from 'react';
import { Sidebar, Menu, Box, Option } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

const Extended = ({
	titleIcon = <Sidebar.Item.Icon name='lock' />,
	title = '',
	avatar,
	actions,
	menuOptions,
	subtitle = '',
	...props
}) => {
	const [hovered, setHovered] = useState(false);

	const onMouseEnter = useMutableCallback(() => {
		setHovered(true);
	});

	const onMouseLeave = useMutableCallback(() => {
		setHovered(false);
	});

	return <Sidebar.Item {...props} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
		<Box mie='x4'>
			<Sidebar.Item.Avatar>
				{ avatar }
			</Sidebar.Item.Avatar>
		</Box>
		<Sidebar.Item.Content>
			<Sidebar.Item.Wrapper>
				{ titleIcon }
				<Sidebar.Item.Title>
					{ title }
				</Sidebar.Item.Title>
			</Sidebar.Item.Wrapper>

			<Sidebar.Item.Wrapper>
				<Sidebar.Item.Subtitle>
					{ subtitle }
				</Sidebar.Item.Subtitle>
			</Sidebar.Item.Wrapper>
		</Sidebar.Item.Content>
		<Sidebar.Item.Container>
			{<Sidebar.Item.Actions>
				{ actions }
				{ menuOptions && <Menu
					square
					small
					color='neutral-700'
					options={menuOptions}
					invisible={!hovered}
					renderItem={({ label: { label, icon }, ...props }) => <Option label={label} title={label} icon={icon} {...props}/>}
				/>}
			</Sidebar.Item.Actions>}
		</Sidebar.Item.Container>
	</Sidebar.Item>;
};

export default Extended;
