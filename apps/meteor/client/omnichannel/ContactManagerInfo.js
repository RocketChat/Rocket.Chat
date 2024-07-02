import { css } from '@rocket.chat/css-in-js';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import React, { useMemo } from 'react';

import { UserStatus } from '../components/UserStatus';
import { AsyncStatePhase } from '../hooks/useAsyncState';
import { useEndpointData } from '../hooks/useEndpointData';
import AgentInfoDetails from '../views/omnichannel/components/AgentInfoDetails';
import Info from '../views/omnichannel/components/Info';

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
