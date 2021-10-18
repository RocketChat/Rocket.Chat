import React from 'react';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { Box, Divider, Flex, Margins } from '@rocket.chat/fuselage';

import NewUsersSection from './NewUsersSection';
import ActiveUsersSection from './ActiveUsersSection';
import UsersByTimeOfTheDaySection from './UsersByTimeOfTheDaySection';
import BusiestChatTimesSection from './BusiestChatTimesSection';

const UsersTab = ({ timezone }) => {
	const isXxlScreen = useBreakpoints().includes('xxl');

	return <>
		<NewUsersSection timezone={timezone}/>
		<Divider />
		<ActiveUsersSection timezone={timezone} />
		<Divider />
		<Box display='flex' mi='x12' flexWrap='wrap'>
			<Margins inline='x12'>
				<Flex.Item grow={1} shrink={0} basis={isXxlScreen ? '0' : '100%'}>
					<UsersByTimeOfTheDaySection timezone={timezone}/>
				</Flex.Item>
				<Box flexGrow={1} flexShrink={0} flexBasis={isXxlScreen ? '0' : '100%'}>
					<BusiestChatTimesSection timezone={timezone}/>
				</Box>
			</Margins>
		</Box>
	</>;
};

export default UsersTab;
