import { Box, Margins, ButtonGroup, ContextualbarSkeleton } from '@rocket.chat/fuselage';
import { useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { HTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';

import {
	Contextualbar,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarHeader,
	ContextualbarScrollableContent,
} from '../../../components/Contextualbar';
import { InfoPanelLabel, InfoPanelText } from '../../../components/InfoPanel';
import { UserInfoAvatar, UserInfoUsername } from '../../../components/UserInfo';
import { UserStatus } from '../../../components/UserStatus';
import { MaxChatsPerAgentDisplay } from '../additionalForms';
import AgentInfoAction from './AgentInfoAction';
import { useRemoveAgent } from './hooks/useRemoveAgent';

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
		return <ContextualbarSkeleton />;
	}

	if (isError) {
		return <Box mbs={16}>{t('User_not_found')}</Box>;
	}

	const { username, statusLivechat, status: userStatus } = data?.user;

	return (
		<Contextualbar data-qa-id='agent-info-contextual-bar'>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('User_Info')}</ContextualbarTitle>
				<ContextualbarClose onClick={() => router.navigate('/omnichannel/agents')} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				{username && (
					<Box alignSelf='center'>
						<UserInfoAvatar data-qa='AgentUserInfoAvatar' username={username} />
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
						<UserInfoUsername data-qa='AgentInfoUserInfoUserName' username={username} status={<UserStatus status={userStatus} />} />
					</Box>
					{statusLivechat && (
						<>
							<InfoPanelLabel data-qa='AgentInfoUserInfoLabel'>{t('Livechat_status')}</InfoPanelLabel>
							<InfoPanelText>{statusLivechat === 'available' ? t('Available') : t('Not_Available')}</InfoPanelText>
						</>
					)}
					{MaxChatsPerAgentDisplay && <MaxChatsPerAgentDisplay maxNumberSimultaneousChat={data.user.livechat?.maxNumberSimultaneousChat} />}
				</Margins>
			</ContextualbarScrollableContent>
		</Contextualbar>
	);
};

export default AgentInfo;
