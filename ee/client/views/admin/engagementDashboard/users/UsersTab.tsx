import { Box, Divider, Flex, Margins } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement } from 'react';

import ActiveUsersSection from './ActiveUsersSection';
import BusiestChatTimesSection from './BusiestChatTimesSection';
import NewUsersSection from './NewUsersSection';
import UsersByTimeOfTheDaySection from './UsersByTimeOfTheDaySection';

type UsersTabProps = {
	timezone: 'utc' | 'local';
};

const UsersTab = ({ timezone }: UsersTabProps): ReactElement => {
	const isXxlScreen = useBreakpoints().includes('xxl');

	return (
		<>
			<NewUsersSection timezone={timezone} />
			<Divider />
			<ActiveUsersSection timezone={timezone} />
			<Divider />
			<Box display='flex' mi='x12' flexWrap='wrap'>
				<Margins inline='x12'>
					<Flex.Item grow={1} shrink={0} basis={isXxlScreen ? '0' : '100%'}>
						<UsersByTimeOfTheDaySection timezone={timezone} />
					</Flex.Item>
					<Box flexGrow={1} flexShrink={0} flexBasis={isXxlScreen ? '0' : '100%'}>
						<BusiestChatTimesSection timezone={timezone} />
					</Box>
				</Margins>
			</Box>
		</>
	);
};

export default UsersTab;
