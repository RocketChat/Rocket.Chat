import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import UserCard from '../../../client/components/UserCard';
import { UserStatus } from '../../../client/components/UserStatus';
import UserAvatar from '../../../client/components/avatar/UserAvatar';
import { AsyncStatePhase } from '../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../client/hooks/useEndpointData';

const wordBreak = css`
	word-break: break-word;
`;

function ContactManagerInfo({ username }) {
	const { value: data, phase: state } = useEndpointData(`users.info?username=${username}`);
	if (!data && state === AsyncStatePhase.LOADING) {
		return null;
	}

	const {
		user: { name, status },
	} = data;

	return (
		<>
			<UserCard.Info className={wordBreak} flexShrink={0} style={{ display: 'flex' }}>
				<UserAvatar title={username} username={username} />
				<UserCard.Username mis='x10' name={username} status={<UserStatus status={status} />} />
				<Box display='flex' mis='x7' mb='x9' align='center' justifyContent='center'>
					({name})
				</Box>
			</UserCard.Info>
		</>
	);
}

export default ContactManagerInfo;
