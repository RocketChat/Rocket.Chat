import React from 'react';

import UserCard from '../../../../../components/UserCard';
import { UserStatus } from '../../../../../components/UserStatus';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../../hooks/useEndpointData';
import { FormSkeleton } from '../../Skeleton';
import Info from './Info';
import Label from './Label';

const AgentField = ({ agent }) => {
	const t = useTranslation();
	const { username } = agent;
	const { value, phase: state } = useEndpointData(`users.info?username=${username}`);

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton />;
	}

	const {
		user: { status },
	} = value || { user: {} };

	return (
		<>
			<Label>{t('Agent')}</Label>
			<Info style={{ display: 'flex' }}>
				<UserAvatar size='x40' title={username} username={username} />
				<UserCard.Username mis='x10' name={username} status={<UserStatus status={status} />} />
			</Info>
		</>
	);
};

export default AgentField;
