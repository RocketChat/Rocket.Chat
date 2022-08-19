import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import { UserStatus } from '../../../../../components/UserStatus';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import AgentInfoDetails from '../../../components/AgentInfoDetails';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import { FormSkeleton } from '../../Skeleton';
import { useUserInfo } from './hooks/useUserInfo';

const AgentField = ({ agent, isSmall = false }) => {
	const t = useTranslation();
	const { username } = agent;

	const { data, isLoading, isError } = useUserInfo(username);

	if (!data || isLoading || isError) {
		return <FormSkeleton />;
	}

	const { user } = data;

	const displayName = user.name || username;

	return (
		<Field>
			<Label>{t('Agent')}</Label>
			<Info style={{ display: 'flex' }}>
				<UserAvatar size={isSmall ? 'x28' : 'x40'} title={username} username={username} />
				<AgentInfoDetails
					mis={isSmall ? 'x8' : 'x10'}
					name={displayName}
					shortName={username}
					status={<UserStatus status={user.status} />}
				/>
			</Info>
		</Field>
	);
};

export default AgentField;
