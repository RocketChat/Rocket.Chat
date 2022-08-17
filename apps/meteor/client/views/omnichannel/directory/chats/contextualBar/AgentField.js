import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo } from 'react';

import { UserStatus } from '../../../../../components/UserStatus';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import AgentInfoDetails from '../../../components/AgentInfoDetails';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import { FormSkeleton } from '../../Skeleton';

const AgentField = ({ agent, isSmall = false }) => {
	const t = useTranslation();
	const { username } = agent;
	const { value, phase: state } = useEndpointData(
		`/v1/users.info`,
		useMemo(() => ({ username }), [username]),
	);

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	const {
		user: { name, status },
	} = value || { user: {} };

	const displayName = name || username;

	return (
		<Field>
			<Label>{t('Agent')}</Label>
			<Info style={{ display: 'flex' }}>
				<UserAvatar size={isSmall ? 'x28' : 'x40'} title={username} username={username} />
				<AgentInfoDetails mis={isSmall ? 'x8' : 'x10'} name={displayName} shortName={username} status={<UserStatus status={status} />} />
			</Info>
		</Field>
	);
};

export default AgentField;
