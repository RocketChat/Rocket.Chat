import { Box, Tabs, Icon } from '@rocket.chat/fuselage';
import React from 'react';

const PageInlineNavbar = () => (
	<Box display='flex' justifyContent='space-between' style={{ margin: '20px 0' }}>
		<Tabs>
			<Tabs.Item>
				<Icon name='chevron-right' />
			</Tabs.Item>
			<Tabs.Item>anime</Tabs.Item>
			<Tabs.Item>art</Tabs.Item>
			<Tabs.Item>cook</Tabs.Item>
			<Tabs.Item>sports</Tabs.Item>
			<Tabs.Item>
				<Icon name='chevron-left' />
			</Tabs.Item>
		</Tabs>
	</Box>
);

export default PageInlineNavbar;
