import { Box, Table } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import UserAvatar from '../../../components/avatar/UserAvatar';
import Count from './Count';
import Order from './Order';
import RemoveAgentButton from './RemoveAgentButton';

const AgentRow = ({ agentId, username, name, avatarETag, mediaQuery, agentList, setAgentList, setAgentsRemoved }) => (
	<Table.Row key={agentId} tabIndex={0} role='link' action qa-user-id={agentId}>
		<Table.Cell withTruncatedText>
			<Box display='flex' alignItems='center'>
				<UserAvatar size={mediaQuery ? 'x28' : 'x40'} title={username} username={username} etag={avatarETag} />
				<Box display='flex' withTruncatedText mi='x8'>
					<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
						<Box fontScale='p2m' withTruncatedText color='default'>
							{name || username}
						</Box>
						{!mediaQuery && name && (
							<Box fontScale='p2' color='hint' withTruncatedText>
								{' '}
								{`@${username}`}{' '}
							</Box>
						)}
					</Box>
				</Box>
			</Box>
		</Table.Cell>
		<Table.Cell fontScale='p2' color='hint' withTruncatedText>
			<Count agentId={agentId} agentList={agentList} setAgentList={setAgentList} />
		</Table.Cell>
		<Table.Cell fontScale='p2' color='hint' withTruncatedText>
			<Order agentId={agentId} agentList={agentList} setAgentList={setAgentList} />
		</Table.Cell>
		<Table.Cell fontScale='p2' color='hint'>
			<RemoveAgentButton agentId={agentId} agentList={agentList} setAgentList={setAgentList} setAgentsRemoved={setAgentsRemoved} />
		</Table.Cell>
	</Table.Row>
);

export default memo(AgentRow);
