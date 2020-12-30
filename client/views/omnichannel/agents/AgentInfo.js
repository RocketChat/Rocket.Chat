import React from 'react';
import { Box, Margins, Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { useSubscription } from 'use-subscription';

import { useTranslation } from '../../../contexts/TranslationContext';
import VerticalBar from '../../../components/VerticalBar';
import { UserInfo } from '../../room/contextualBar/UserInfo';
import { UserStatus } from '../../../components/UserStatus';
import { FormSkeleton } from '../../../components/Skeleton';
import { formsSubscription } from '../additionalForms';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../hooks/useAsyncState';

export const AgentInfo = React.memo(function AgentInfo({
	uid,
	children,
	...props
}) {
	const t = useTranslation();
	const { value: data, phase: state, error } = useEndpointData(`livechat/users/agent/${ uid }`);
	const eeForms = useSubscription(formsSubscription);

	const {
		useMaxChatsPerAgentDisplay = () => {},
	} = eeForms;

	const MaxChats = useMaxChatsPerAgentDisplay();

	if (state === AsyncStatePhase.LOADING) {
		return <FormSkeleton/>;
	}

	if (error || !data || !data.user) {
		return <Box mbs='x16'>{t('User_not_found')}</Box>;
	}

	const { user } = data;
	const {
		username,
		statusLivechat,
		status: userStatus,
	} = user;

	return <VerticalBar.ScrollableContent p='x24' {...props}>

		<Box alignSelf='center'>
			<UserInfo.Avatar size={'x332'} username={username}/>
		</Box>

		<ButtonGroup mi='neg-x4' flexShrink={0} flexWrap='nowrap' withTruncatedText justifyContent='center' flexShrink={0}>
			{children}
		</ButtonGroup>

		<Margins block='x4'>
			<Box mb='x2'>
				<UserInfo.Username name={username} status={<UserStatus status={userStatus} />} />
			</Box>

			{statusLivechat && <>
				<UserInfo.Label>{t('Livechat_status')}</UserInfo.Label>
				<UserInfo.Info>{t(statusLivechat)}</UserInfo.Info>
			</>}

			{MaxChats && <MaxChats data={user}/>}

		</Margins>

	</VerticalBar.ScrollableContent>;
});

export const Action = ({ icon, label, ...props }) => (
	<Button title={label} {...props} mi='x4'>
		<Icon name={icon} size='x20' mie='x4' />
		{label}
	</Button>
);

AgentInfo.Action = Action;

export default AgentInfo;
