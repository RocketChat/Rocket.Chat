import { css } from '@rocket.chat/css-in-js';
import React, { useMemo } from 'react';

import { UserStatus } from '../../../client/components/UserStatus';
import UserAvatar from '../../../client/components/avatar/UserAvatar';
import { AsyncStatePhase } from '../../../client/hooks/useAsyncState';
import { useEndpointData } from '../../../client/hooks/useEndpointData';
import AgentInfoDetails from '../../../client/views/omnichannel/components/AgentInfoDetails';
import Info from '../../../client/views/omnichannel/components/Info';

const wordBreak = css`
	word-break: break-word;
`;

function ContactManagerInfo({ username }) {
	const { value: data, phase: state } = useEndpointData('/v1/users.info', { params: useMemo(() => ({ username }), [username]) });
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
				<AgentInfoDetails mis={10} name={name} shortName={username} status={<UserStatus status={status} />} />
			</Info>
		</>
	);
}

export default ContactManagerInfo;
