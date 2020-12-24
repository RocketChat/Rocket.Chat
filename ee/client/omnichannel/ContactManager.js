import React from 'react';
import { Box } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import { useEndpointData } from '../../../client/hooks/useEndpointData';
import { AsyncStatePhase } from '../../../client/hooks/useAsyncState';
import UserAvatar from '../../../client/components/avatar/UserAvatar';
import { UserStatus } from '../../../client/components/UserStatus';
import UserCard from '../../../client/components/UserCard';

const wordBreak = css`
	word-break: break-word;
`;
const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;

export function ContactManagerInfo({ username }) {
	const { value: data, phase: state } = useEndpointData(`users.info?username=${ username }`);
	if (!data && state === AsyncStatePhase.LOADING) { return null; }
	const { user: { name, status } } = data;
	return <>
		<Info style={{ display: 'flex' }}>
			<UserAvatar title={username} username={username} />
			<UserCard.Username mis='x10' name={username} status={<UserStatus status={status} />} />
			<Box display='flex' mis='x7' mb='x9' align='center' justifyContent='center'>({name})</Box>
		</Info>
	</>;
}
