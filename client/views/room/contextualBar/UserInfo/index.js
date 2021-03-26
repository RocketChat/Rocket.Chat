import { Box, Margins, Tag, Button, Icon } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';

import MarkdownText from '../../../../components/MarkdownText';
import { FormSkeleton } from '../../../../components/Skeleton';
import { UTCClock } from '../../../../components/UTCClock';
import UserCard from '../../../../components/UserCard';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import VerticalBar from '../../../../components/VerticalBar';
import UserAvatar from '../../../../components/avatar/UserAvatar';
import { useRolesDescription } from '../../../../contexts/AuthorizationContext';
import { useSetting } from '../../../../contexts/SettingsContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import { getUserEmailAddress } from '../../../../lib/getUserEmailAddress';
import { getUserEmailVerified } from '../../../../lib/getUserEmailVerified';
import InfoPanel from '../../../InfoPanel';
import UserActions from './actions/UserActions';

const Avatar = ({ username, ...props }) => (
	<UserAvatar title={username} username={username} {...props} />
);
const Username = ({ username, status, ...props }) => (
	<UserCard.Username name={username} status={status} {...props} />
);

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
	actions,
	...props
}) {
	const t = useTranslation();

	const timeAgo = useTimeAgo();

	return (
		<VerticalBar.ScrollableContent p='x24' {...props}>
			<InfoPanel>
				<InfoPanel.Avatar>
					<Avatar size={'x332'} username={username} etag={data?.avatarETag} />
				</InfoPanel.Avatar>

				{actions && <InfoPanel.Section>{actions}</InfoPanel.Section>}

				<InfoPanel.Section>
					<InfoPanel.Title title={(showRealNames && name) || username || name} icon={status} />

					<InfoPanel.Text>{customStatus}</InfoPanel.Text>
				</InfoPanel.Section>

				<InfoPanel.Section>
					{!!roles && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Roles')}</InfoPanel.Label>
							<UserCard.Roles>{roles}</UserCard.Roles>
						</InfoPanel.Field>
					)}

					{Number.isInteger(utcOffset) && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Local_Time')}</InfoPanel.Label>
							<InfoPanel.Text>
								<UTCClock utcOffset={utcOffset} />
							</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{username && username !== name && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Username')}</InfoPanel.Label>
							<InfoPanel.Text>{username}</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					<InfoPanel.Field>
						<InfoPanel.Label>{t('Last_login')}</InfoPanel.Label>
						<InfoPanel.Text>{lastLogin ? timeAgo(lastLogin) : t('Never')}</InfoPanel.Text>
					</InfoPanel.Field>

					{name && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Full_Name')}</InfoPanel.Label>
							<InfoPanel.Text>{name}</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{nickname && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Nickname')}</InfoPanel.Label>
							<InfoPanel.Text>{nickname}</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{bio && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Bio')}</InfoPanel.Label>
							<InfoPanel.Text withTruncatedText={false}>
								<MarkdownText variant='inline' content={bio} />
							</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{phone && (
						<InfoPanel.Field>
							{' '}
							<InfoPanel.Label>{t('Phone')}</InfoPanel.Label>
							<InfoPanel.Text display='flex' flexDirection='row' alignItems='center'>
								<Box is='a' withTruncatedText href={`tel:${phone}`}>
									{phone}
								</Box>
							</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{email && (
						<InfoPanel.Field>
							{' '}
							<InfoPanel.Label>{t('Email')}</InfoPanel.Label>
							<InfoPanel.Text display='flex' flexDirection='row' alignItems='center'>
								<Box is='a' withTruncatedText href={`mailto:${email}`}>
									{email}
								</Box>
								<Margins inline='x4'>
									{verified && <Tag variant='primary'>{t('Verified')}</Tag>}
									{verified || <Tag disabled>{t('Not_verified')}</Tag>}
								</Margins>
							</InfoPanel.Text>
						</InfoPanel.Field>
					)}

					{customFields &&
						Object.entries(customFields).map(([label, value]) => (
							<InfoPanel.Field key={label}>
								<InfoPanel.Label>{t(label)}</InfoPanel.Label>
								<InfoPanel.Text>{value}</InfoPanel.Text>
							</InfoPanel.Field>
						))}

					<InfoPanel.Field>
						<InfoPanel.Label>{t('Created_at')}</InfoPanel.Label>
						<InfoPanel.Text>{timeAgo(createdAt)}</InfoPanel.Text>
					</InfoPanel.Field>
				</InfoPanel.Section>
			</InfoPanel>
		</VerticalBar.ScrollableContent>
	);
});

export const Action = ({ icon, label, ...props }) => (
	<Button title={label} {...props} mi='x4'>
		<Icon name={icon} size='x20' mie='x4' />
		{label}
	</Button>
);

UserInfo.Action = Action;
UserInfo.Avatar = Avatar;
UserInfo.Info = InfoPanel.Text;
UserInfo.Label = InfoPanel.Label;
UserInfo.Username = Username;

export const UserInfoWithData = React.memo(function UserInfoWithData({
	uid,
	username,
	tabBar,
	rid,
	onClickClose,
	onClose = onClickClose,
	video,
	onClickBack,
	...props
}) {
	const t = useTranslation();

	const getRoles = useRolesDescription();

	const showRealNames = useSetting('UI_Use_Real_Name');

	const { value, phase: state, error } = useEndpointData(
		'users.info',
		useMemo(() => ({ ...(uid && { userId: uid }), ...(username && { username }) }), [
			uid,
			username,
		]),
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
			roles:
				roles &&
				getRoles(roles).map((role, index) => <UserCard.Role key={index}>{role}</UserCard.Role>),
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

			{(error && (
				<VerticalBar.Content>
					<Box mbs='x16'>{t('User_not_found')}</Box>
				</VerticalBar.Content>
			)) ||
				(state === AsyncStatePhase.LOADING && (
					<VerticalBar.Content>
						<FormSkeleton />
					</VerticalBar.Content>
				)) || (
					<UserInfo
						{...user}
						data={user}
						actions={<UserActions user={user} rid={rid} />}
						{...props}
						p='x24'
					/>
				)}
		</>
	);
});

export default UserInfoWithData;
