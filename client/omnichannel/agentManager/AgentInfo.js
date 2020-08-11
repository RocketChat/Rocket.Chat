import React from 'react';
import { Box, Margins, Tag, Button, Icon } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import { useTranslation } from '../../contexts/TranslationContext';
import VerticalBar from '../../components/basic/VerticalBar';
import UserAvatar from '../../components/basic/avatar/UserAvatar';
import UserCard from '../../components/basic/UserCard';

const Label = (props) => <Box fontScale='p2' color='default' {...props} />;

const wordBreak = css`
	word-break: break-word;
`;

const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;

export const UserInfo = React.memo(function UserInfo({
	username,
	status,
	data,
	// onChange,
	statusLivechat,
	departments,
	actions,
	...props
}) {
	const t = useTranslation();

	return <VerticalBar.ScrollableContent p='x24' {...props}>

		<UserAvatar margin='auto' size={'x332'} title={username} username={username}/>

		{actions}

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

UserInfo.Action = Action;

export default UserInfo;
