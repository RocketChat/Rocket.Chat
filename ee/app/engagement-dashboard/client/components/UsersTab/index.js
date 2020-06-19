import { Box, Divider, Flex, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { NewUsersSection } from './NewUsersSection';
import { ActiveUsersSection } from './ActiveUsersSection';
import { UsersByTimeOfTheDaySection } from './UsersByTimeOfTheDaySection';
import { BusiestChatTimesSection } from './BusiestChatTimesSection';

export function UsersTab() {
	return <>
		<NewUsersSection />
		<Divider />
		<ActiveUsersSection />
		<Divider />
		<Box display='flex' mi='x12'>
			<Margins inline='x12'>
				<Flex.Item grow={1} shrink={0} basis='0'>
					<UsersByTimeOfTheDaySection />
				</Flex.Item>
				<Box flexGrow={1} flexShrink={0} flexBasis='0'>
					<BusiestChatTimesSection />
				</Box>
			</Margins>
		</Box>
	</>;
}
