import type { ILivechatDepartmentAgents } from '@rocket.chat/core-typings';
import { Box, Table } from '@rocket.chat/fuselage';
import type { Dispatch, Key, SetStateAction } from 'react';
import React, { memo } from 'react';

import UserAvatar from '../../../components/avatar/UserAvatar';
import Count from './Count';
import Order from './Order';
import RemoveAgentButton from './RemoveAgentButton';

type AgentRowProps = {
	agentId: Key;
	username: string;
	name?: string;
	avatarETag?: string;
	mediaQuery: boolean;
	agentList: ILivechatDepartmentAgents[];
	setAgentList: Dispatch<SetStateAction<ILivechatDepartmentAgents[]>>;
	setAgentsRemoved: Dispatch<SetStateAction<never[]>>;
};

const AgentRow = ({ agentId, username, name, avatarETag, mediaQuery, agentList, setAgentList, setAgentsRemoved }: AgentRowProps) => (
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
