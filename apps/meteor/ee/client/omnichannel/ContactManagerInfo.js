import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import { UserStatus } from '../../../client/components/UserStatus';
import UserAvatar from '../../../client/components/avatar/UserAvatar';
import { AsyncStatePhase } from '../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../client/hooks/useEndpointData';
import AgentOrContactDetails from '../../../client/views/omnichannel/components/AgentOrContactDetails';
import Info from '../../../client/views/omnichannel/components/Info';

const wordBreak = css`
	word-break: break-word;
`;

function ContactManagerInfo({ username }) {
	const { value: data, phase: state } = useEndpointData(
		`/v1/users.info`,
		useMemo(() => ({ username }), [username]),
	);
	if (!data && state === AsyncStatePhase.LOADING) {
		return null;
	}

	const {
		user: { name, status },
	} = data;

	return (
		<>
			<Info className={wordBreak} style={{ display: 'flex' }}>
				<UserAvatar title={username} username={username} />
				<AgentOrContactDetails mis='x10' name={username} status={<UserStatus status={status} />} />
				{name && (
					<Box display='flex' mis='x7' mb='x9' align='center' justifyContent='center'>
						({name})
					</Box>
				)}
			</Info>
		</>
	);
}

export default ContactManagerInfo;
