import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { FormSkeleton } from './FormSkeleton';
import { UserStatus } from '../../../../components/UserStatus';
import AgentInfoDetails from '../../components/AgentInfoDetails';
import Field from '../../components/Field';
import Info from '../../components/Info';
import Label from '../../components/Label';

type AgentFieldProps = {
	agent: IOmnichannelRoom['servedBy'];
	isSmall?: boolean;
};

const AgentField = ({ agent, isSmall = false }: AgentFieldProps) => {
	const { t } = useTranslation();
	const { username = '' } = agent ?? {};
	const getUserInfo = useEndpoint('GET', '/v1/users.info');
	const { data, isLoading } = useQuery({
		queryKey: ['/v1/users.info', username],
		queryFn: () => getUserInfo({ username }),
	});

	if (isLoading) {
		return <FormSkeleton />;
	}

	const {
		user: { name, status },
	} = data ?? { user: {} };

	const displayName = name || username;

	return (
		<Field>
			<Label>{t('Agent')}</Label>
			<Info style={{ display: 'flex' }}>
				<UserAvatar size={isSmall ? 'x28' : 'x40'} title={username} username={username || ''} />
				<AgentInfoDetails mis={isSmall ? 'x8' : 'x10'} name={displayName} shortName={username} status={<UserStatus status={status} />} />
			</Info>
		</Field>
	);
};

export default AgentField;
