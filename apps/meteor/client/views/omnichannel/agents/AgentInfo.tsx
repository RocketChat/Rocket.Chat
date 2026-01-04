import { Box, Margins, ButtonGroup } from '@rocket.chat/fuselage';
import {
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarHeader,
	ContextualbarScrollableContent,
	ContextualbarSkeletonBody,
	InfoPanelLabel,
	InfoPanelText,
} from '@rocket.chat/ui-client';
import { useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import AgentInfoAction from './AgentInfoAction';
import { useRemoveAgent } from './hooks/useRemoveAgent';
import { UserInfoAvatar, UserInfoUsername } from '../../../components/UserInfo';
import { UserStatus } from '../../../components/UserStatus';
import { MaxChatsPerAgentDisplay } from '../additionalForms';

type AgentInfoProps = {
	uid: string;
} & Omit<HTMLAttributes<HTMLElement>, 'is'>;

const AgentInfo = ({ uid }: AgentInfoProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const getAgentById = useEndpoint('GET', '/v1/livechat/users/agent/:_id', { _id: uid });
	const { data, isPending, isError } = useQuery({
		queryKey: ['livechat-getAgentInfoById', uid],
		queryFn: async () => getAgentById(),
		refetchOnWindowFocus: false,
	});

	const handleDelete = useRemoveAgent(uid);

	if (isPending) {
		return <ContextualbarSkeletonBody />;
	}

	if (isError) {
		return <Box mbs={16}>{t('User_not_found')}</Box>;
	}

	const { username, statusLivechat, status: userStatus } = data?.user;

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('User_Info')}</ContextualbarTitle>
				<ContextualbarClose onClick={() => router.navigate('/omnichannel/agents')} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				{username && (
					<Box alignSelf='center'>
						<UserInfoAvatar username={username} />
					</Box>
				)}
				<ButtonGroup align='center'>
					<AgentInfoAction
						key={t('Edit')}
						title={t('Edit')}
						label={t('Edit')}
						onClick={() => router.navigate(`/omnichannel/agents/edit/${uid}`)}
						icon='edit'
					/>
					<AgentInfoAction key={t('Remove')} title={t('Remove')} label={t('Remove')} onClick={handleDelete} icon='trash' />
				</ButtonGroup>
				<Margins block={4}>
					<Box mb={2}>
						<UserInfoUsername username={username} status={<UserStatus status={userStatus} />} />
					</Box>
					{statusLivechat && (
						<>
							<InfoPanelLabel>{t('Livechat_status')}</InfoPanelLabel>
							<InfoPanelText>{statusLivechat === 'available' ? t('Available') : t('Not_Available')}</InfoPanelText>
						</>
					)}
					{MaxChatsPerAgentDisplay && <MaxChatsPerAgentDisplay maxNumberSimultaneousChat={data.user.livechat?.maxNumberSimultaneousChat} />}
				</Margins>
			</ContextualbarScrollableContent>
		</>
	);
};

export default AgentInfo;
