import React, { useMemo } from 'react';
import { Box, Margins, Tag, Button, Icon } from '@rocket.chat/fuselage';
import { css } from '@rocket.chat/css-in-js';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { useSetting } from '../../../../contexts/SettingsContext';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import UserCard from '../../../../components/UserCard';
import VerticalBar from '../../../../components/VerticalBar';
import { useRolesDescription } from '../../../../contexts/AuthorizationContext';
import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import { UTCClock } from '../../../../components/UTCClock';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import MarkdownText from '../../../../components/MarkdownText';
import UserActions from './actions/UserActions';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import { FormSkeleton } from '../../../../components/Skeleton';
import { getUserEmailVerified } from '../../../../lib/getUserEmailVerified';

const Label = (props) => <Box fontScale='p2' color='default' {...props} />;

const wordBreak = css`
	word-break: break-word;
`;

const Info = ({ className, ...props }) => <UserCard.Info className={[className, wordBreak]} flexShrink={0} {...props}/>;
const Avatar = ({ username, ...props }) => <UserAvatar title={username} username={username} {...props}/>;
const Username = ({ username, status, ...props }) => <UserCard.Username name={username} status={status} {...props}/>;

export const UserInfo = React.memo(function UserInfo({
	username,
	bio,
	email,
	verified,
	showRealNames,
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
	nickname,
	// onChange,
	actions,
	...props
}) {
	const t = useTranslation();

	const timeAgo = useTimeAgo();

	return <VerticalBar.ScrollableContent p='x24' {...props}>

		<Box alignSelf='center'>
			<Avatar size={'x332'} username={username} etag={data?.avatarETag}/>
		</Box>

		{actions}

		<Margins block='x4'>
			<UserCard.Username name={(showRealNames && name) || username || name} status={status} />
			<Info>{customStatus}</Info>

			{!!roles && <>
				<Label>{t('Roles')}</Label>
				<UserCard.Roles>{roles}</UserCard.Roles>
			</>}

			{Number.isInteger(utcOffset) && <>
				<Label>{t('Local_Time')}</Label>
				<Info><UTCClock utcOffset={utcOffset}/></Info>
			</>}

			{username && username !== name && <>
				<Label>{t('Username')}</Label>
				<Info>{username}</Info>
			</>}

			<Label>{t('Last_login')}</Label>
			<Info>{lastLogin ? timeAgo(lastLogin) : t('Never')}</Info>

			{name && <>
				<Label>{t('Full_Name')}</Label>
				<Info>{name}</Info>
			</>}

			{nickname && <>
				<Label>{t('Nickname')}</Label>
				<Info>{nickname}</Info>
			</>}

			{bio && <>
				<Label>{t('Bio')}</Label>
				<Info withTruncatedText={false}><MarkdownText variant='inline' content={bio}/></Info>
			</>}

			{phone && <> <Label>{t('Phone')}</Label>
				<Info display='flex' flexDirection='row' alignItems='center'>
					<Box is='a' withTruncatedText href={`tel:${ phone }`}>{phone}</Box>
				</Info>
			</>}

			{email && <> <Label>{t('Email')}</Label>
				<Info display='flex' flexDirection='row' alignItems='center'>
					<Box is='a' withTruncatedText href={`mailto:${ email }`}>{email}</Box>
					<Margins inline='x4'>
						{verified && <Tag variant='primary'>{t('Verified')}</Tag>}
						{verified || <Tag disabled>{t('Not_verified')}</Tag>}
					</Margins>
				</Info>
			</>}

			{ customFields && Object.entries(customFields).map(([label, value]) => <React.Fragment key={label}>
				<Label>{t(label)}</Label>
				<Info>{value}</Info>
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
UserInfo.Avatar = Avatar;
UserInfo.Info = Info;
UserInfo.Label = Label;
UserInfo.Username = Username;

export const UserInfoWithData = React.memo(function UserInfoWithData({ uid, username, tabBar, rid, onClickClose, onClose = onClickClose, video, onClickBack, ...props }) {
	const t = useTranslation();

	const getRoles = useRolesDescription();

	const showRealNames = useSetting('UI_Use_Real_Name');

	const { value, phase: state, error } = useEndpointData(
		'users.info',
		useMemo(
			() => ({ ...uid && { userId: uid }, ...username && { username } }),
			[uid, username],
		),
	);

	const user = useMemo(() => {
		const { user } = value || { user: {} };
		const {
			_id,
			name,
			username,
			roles = [],
			status = null,
			statusText,
			bio,
			utcOffset,
			lastLogin,
			nickname,
		} = user;
		return {
			_id,
			name: showRealNames ? name : username,
			username,
			lastLogin,
			roles: roles && getRoles(roles).map((role, index) => (
				<UserCard.Role key={index}>{role}</UserCard.Role>
			)),
			bio,
			phone: user.phone,
			customFields: user.customFields,
			verified: getUserEmailVerified(user),
			email: getUserEmailAddress(user),
			utcOffset,
			createdAt: user.createdAt,
			// localTime: <LocalTime offset={utcOffset} />,
			status: status && <ReactiveUserStatus uid={_id} presence={status} />,
			customStatus: statusText,
			nickname,
		};
	}, [value, showRealNames, getRoles]);

	return (
		<>
			<VerticalBar.Header>
				{onClickBack && <VerticalBar.Back onClick={onClickBack} />}
				<VerticalBar.Text>{t('User_Info')}</VerticalBar.Text>
				{onClose && <VerticalBar.Close onClick={onClose} />}
			</VerticalBar.Header>

			{
				(error && <VerticalBar.Content>
					<Box mbs='x16'>{t('User_not_found')}</Box>
				</VerticalBar.Content>)
				|| (state === AsyncStatePhase.LOADING && <VerticalBar.Content>
					<FormSkeleton />
				</VerticalBar.Content>)
				|| <UserInfo
					{...user}
					data={user}
					// onChange={onChange}
					actions={<UserActions user={user} rid={rid}/>}
					{...props}
					p='x24'
				/>
			}
		</>
	);
});

export default UserInfoWithData;
