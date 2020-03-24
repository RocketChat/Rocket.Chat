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
		<Flex.Container>
			<Margins inline='x12'>
				<Box>
					<Margins inline='x12'>
						<Flex.Item grow={1} shrink={0} basis='0'>
							<UsersByTimeOfTheDaySection />
						</Flex.Item>
						<Flex.Item grow={1} shrink={0} basis='0'>
							<Box>
								<BusiestChatTimesSection />
							</Box>
						</Flex.Item>
					</Margins>
				</Box>
			</Margins>
		</Flex.Container>
	</>;
}
