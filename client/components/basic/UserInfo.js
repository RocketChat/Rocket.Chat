import React from 'react';
import { Box, Margins, Tag, Button, Icon } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import { useTimeAgo } from '../../hooks/useTimeAgo';
import { useTranslation } from '../../contexts/TranslationContext';
// import MarkdownText from './MarkdownText';
import VerticalBar from './VerticalBar';
import { UTCClock } from './UTCClock';
import UserAvatar from './avatar/UserAvatar';
import UserCard from './UserCard';
import MarkdownText from './MarkdownText';

const Label = (props) => <Box fontScale='p2' color='default' {...props} />;

const wordBreak = css`
	word-break: break-word;
`;

const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;
// const timeAgo = (e) => e;

export const UserInfo = React.memo(function UserInfo({
	username,
	bio,
	email,
	status,
	phone,
	customStatus,
	roles = [],
	lastLogin,
	createdAt,
	utcOffset,
	customFields = [],
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
			<Info>{lastLogin ? timeAgo(lastLogin) : t('Never')}</Info>

			{name && <>
				<Label>{t('Full Name')}</Label>
				<Info>{name}</Info>
			</>}

			{bio && <>
				<Label>{t('Bio')}</Label>
				<Info withTruncatedText={false}><MarkdownText>{bio}</MarkdownText></Info>
			</>}

			{phone && <> <Label>{t('Phone')}</Label>
				<Info display='flex' flexDirection='row' alignItems='center'>
					<Box is='a' withTruncatedText href={`tel:${ phone }`}>{phone}</Box>
				</Info>
			</>}

			{email && <> <Label>{t('Email')}</Label>
				<Info display='flex' flexDirection='row' alignItems='center'>
					<Box is='a' withTruncatedText href={`mailto:${ email.address }`}>{email.address}</Box>
					<Margins inline='x4'>
						{email.verified && <Tag variant='primary'>{t('Verified')}</Tag>}
						{email.verified || <Tag disabled>{t('Not_verified')}</Tag>}
					</Margins>
				</Info>
			</>}

			{ customFields && customFields.map((customField) => <React.Fragment key={customField.label}>
				<Label>{t(customField.label)}</Label>
				<Info>{customField.value}</Info>
			</React.Fragment>) }

			<Label>{t('Created_at')}</Label>
			<Info>{timeAgo(createdAt)}</Info>

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
