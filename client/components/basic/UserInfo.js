import React from 'react';
import { Box, Margins, Tag, Button, Icon } from '@rocket.chat/fuselage';


import { useTimeAgo } from '../../hooks/useTimeAgo';
import { useTranslation } from '../../contexts/TranslationContext';
// import MarkdownText from './MarkdownText';
import VerticalBar from './VerticalBar';
import { UTCClock } from './UTCClock';
import UserAvatar from './avatar/UserAvatar';
import UserCard from './UserCard';


const Label = (props) => <Box fontScale='p2' color='default' {...props} />;

const Info = (props) => <UserCard.Info flexShrink={0} {...props}/>;
// const timeAgo = (e) => e;

export const UserInfo = React.memo(function UserInfo({
	username,
	bio,
	email,
	status,
	customStatus,
	roles = [],
	lastLogin,
	createdAt,
	utcOffset,
	name,
	data,
	// onChange,
	actions,
	...props
}) {
	const t = useTranslation();

	const timeAgo = useTimeAgo();

	return <VerticalBar.ScrollableContent p='x24' {...props}>

		<UserAvatar size={'x332'} title={username} username={username}/>

		{actions}

		<Margins block='x4'>
			<UserCard.Username name={username} status={status} />
			<Info>{customStatus}</Info>

			{!!roles && <>
				<Label>{t('Roles')}</Label>
				<UserCard.Roles>{roles}</UserCard.Roles>
			</>}

			{Number.isInteger(utcOffset) && <>
				<Label>{t('Local Time')}</Label>
				<Info><UTCClock utcOffset={utcOffset}/></Info>
			</>}

			<Label>{t('Last_login')}</Label>
			<Info >{lastLogin ? timeAgo(lastLogin) : t('Never')}</Info>

			{name && <>
				<Label>{t('Full Name')}</Label>
				<Info>{name}</Info>
			</>}

			{bio && <>
				<Label>{t('Bio')}</Label>
				<Info withTruncatedText={false}>{bio}</Info>
			</>}

			{email && <> <Label>{t('Email')}</Label>
				<Info display='flex' flexDirection='row' alignItems='center'>
					<Box withTruncatedText>{email.address}</Box>
					<Margins inline='x4'>
						{email.verified && <Tag variant='primary'>{t('Verified')}</Tag>}
						{email.verified || <Tag disabled>{t('Not_verified')}</Tag>}
					</Margins>
				</Info>
			</>}

			<Label>{t('Created_at')}</Label>
			<Info>{timeAgo(createdAt)}</Info>


		</Margins>

	</VerticalBar.ScrollableContent>;
});

export const Action = ({ icon, label, ...props }) => (
	<Button {...props} mi='x2'>
		<Icon name={icon} size='x16' />
		{label}
	</Button>
);

UserInfo.Action = Action;

export default UserInfo;
