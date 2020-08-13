import React from 'react';
import { Box, Margins, Button, Icon, ButtonGroup } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from '../../components/basic/VerticalBar';
import UserAvatar from '../../components/basic/avatar/UserAvatar';
import { useEndpointDataExperimental } from '../../hooks/useEndpointDataExperimental';
import UserCard from '../../components/basic/UserCard';
import * as UserStatus from '../../components/basic/UserStatus';
import { FormSkeleton } from './Skeleton';

const Label = (props) => <Box fontScale='p2' color='default' {...props} />;

const wordBreak = css`
	word-break: break-word;
`;

// username,
// 	status,
// 	data,
// 	// onChange,
// 	statusLivechat,
// 	departments,
// 	actions,
// 	...props

const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;

export const AgentInfo = React.memo(function UserInfo({
	uid,
	children,
	...props
}) {
	const t = useTranslation();
	const { data, state } = useEndpointDataExperimental(`livechat/users/agent/${ uid }`);

	if (state === 'LOADING') {
		return <FormSkeleton/>;
	}


	const { user } = data || { user: {} };
	const {
		username,
		statusLivechat,
	} = user;

	const status = UserStatus.getStatus(data.status);

	return <VerticalBar.ScrollableContent p='x24' {...props}>

		<UserAvatar margin='auto' size={'x332'} title={username} username={username}/>

		<ButtonGroup mi='neg-x4' flexShrink={0} flexWrap='nowrap' withTruncatedText justifyContent='center' flexShrink={0}>
			{children}
		</ButtonGroup>

		<Margins block='x4'>
			<UserCard.Username name={username} status={status} />

			{statusLivechat && <>
				<Label>{t('Livechat_Status')}</Label>
				<Info>{t(statusLivechat)}</Info>
			</>}
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
