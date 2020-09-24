import React from 'react';
import { Sidebar, Menu, Box, Option } from '@rocket.chat/fuselage';

import { useFormatTime } from '../../hooks/useFormatTime';

const Extended = React.memo(({
	titleIcon = <Sidebar.Item.Icon name='lock' />,
	title = '',
	avatar,
	actions,
	href,
	time,
	menuOptions,
	subtitle = '',
	...props
}) => {
	const formatDate = useFormatTime();

	return <Sidebar.Item {...props} href={href} clickable={!!href}>
		{ avatar && <Box mie='x4'>
			<Sidebar.Item.Avatar>
				{ avatar }
			</Sidebar.Item.Avatar>
		</Box>}
		<Sidebar.Item.Content>
			<Box display='flex' alignItems='stretch' flexDirection='column' w='full'>
				<Sidebar.Item.Wrapper>
					{ titleIcon }
					<Sidebar.Item.Title>
						{ title }
					</Sidebar.Item.Title>
					{time && <Sidebar.Item.Time>{formatDate(time)}</Sidebar.Item.Time>}
				</Sidebar.Item.Wrapper>

				<Sidebar.Item.Wrapper>
					<Sidebar.Item.Subtitle>
						{ subtitle }
					</Sidebar.Item.Subtitle>
				</Sidebar.Item.Wrapper>
			</Box>
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
	</Sidebar.Item>;
});

export default Extended;
