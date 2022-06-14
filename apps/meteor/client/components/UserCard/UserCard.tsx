import { css } from '@rocket.chat/css-in-js';
import { Box, ActionButton, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { forwardRef, ReactNode, ComponentProps } from 'react';

import MarkdownText from '../MarkdownText';
import * as Status from '../UserStatus';
import UserAvatar from '../avatar/UserAvatar';
import UserCardContainer from './UserCardContainer';
import UserCardInfo from './UserCardInfo';
import UserCardRoles from './UserCardRoles';
import UserCardUsername from './UserCardUsername';

const clampStyle = css`
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 3;
	-webkit-box-orient: vertical;
	word-break: break-all;
`;

type UserCardProps = {
	className?: string;
	style?: ComponentProps<typeof Box>['style'];
	open?: () => void;
	name?: string;
	username?: string;
	etag?: string;
	customStatus?: ReactNode;
	roles?: ReactNode;
	bio?: ReactNode;
	status?: ReactNode;
	actions?: ReactNode;
	localTime?: ReactNode;
	onClose?: () => void;
	nickname?: string;
};

const UserCard = forwardRef(function UserCard(
	{
		className,
		style,
		open,
		name,
		username,
		etag,
		customStatus = <Skeleton width='100%' />,
		roles = (
			<>
				<Skeleton width='32%' mi='x2' />
				<Skeleton width='32%' mi='x2' />
				<Skeleton width='32%' mi='x2' />
			</>
		),
		bio = (
			<>
				<Skeleton width='100%' />
				<Skeleton width='100%' />
				<Skeleton width='100%' />
			</>
		),
		status = <Status.Offline />,
		actions,
		localTime = <Skeleton width='100%' />,
		onClose,
		nickname,
	}: UserCardProps,
	ref,
) {
	const t = useTranslation();

	return (
		<UserCardContainer data-qa='UserCard' className={className} ref={ref} style={style}>
			<Box>
				{!username ? <Skeleton width='x124' height='x124' variant='rect' /> : <UserAvatar username={username} etag={etag} size='x124' />}
				{actions && (
					<Box flexGrow={0} display='flex' mb='x12' alignItems='center' justifyContent='center'>
						{actions}
					</Box>
				)}
			</Box>
			<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} mis='x24' width='1px'>
				<Box mbe='x4' withTruncatedText display='flex'>
					{!name ? <Skeleton width='100%' /> : <UserCardUsername status={status} name={name} />}
					{nickname && (
						<Box flexGrow={1} flexShrink={1} flexBasis={0} title={t('Nickname')} color='hint' mis='x4' fontScale='p2' withTruncatedText>
							({nickname})
						</Box>
					)}
				</Box>
				{customStatus && (
					<UserCardInfo mbe='x16'>
						{typeof customStatus === 'string' ? (
							<MarkdownText withTruncatedText variant='inlineWithoutBreaks' content={customStatus} parseEmoji={true} />
						) : (
							customStatus
						)}
					</UserCardInfo>
				)}
				<UserCardRoles>{roles}</UserCardRoles>
				<UserCardInfo>{localTime}</UserCardInfo>
				{bio && (
					<UserCardInfo withTruncatedText={false} className={clampStyle} height='x60'>
						{typeof bio === 'string' ? <MarkdownText variant='inline' content={bio} /> : bio}
					</UserCardInfo>
				)}
				{open && <a onClick={open}>{t('See_full_profile')}</a>}
			</Box>
			{onClose && (
				<Box>
					<ActionButton small ghost title={t('Close')} icon='cross' onClick={onClose} />
				</Box>
			)}
		</UserCardContainer>
	);
});

export default UserCard;
