import { css } from '@rocket.chat/css-in-js';
import { Box, IconButton, Skeleton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactNode, ComponentProps, MouseEvent } from 'react';
import React, { forwardRef } from 'react';

import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';
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
	open?: (e: MouseEvent<HTMLElement>) => void;
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
	isLoading?: boolean;
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
				<Skeleton flexGrow={1} mi={2} />
				<Skeleton flexGrow={1} mi={2} />
				<Skeleton flexGrow={1} mi={2} />
			</>
		),
		bio = <Skeleton width='100%' />,
		status = <Status.Offline />,
		actions,
		localTime = <Skeleton width='100%' />,
		onClose,
		nickname,
		isLoading,
	}: UserCardProps,
	ref,
) {
	const t = useTranslation();
	const isLayoutEmbedded = useEmbeddedLayout();

	return (
		<UserCardContainer data-qa='UserCard' className={className} ref={ref} style={style} height='x228'>
			<Box>
				{!isLoading && username ? (
					<UserAvatar username={username} etag={etag} size='x124' />
				) : (
					<Skeleton borderRadius='x4' width='x124' height='x124' variant='rect' />
				)}
				<Box flexGrow={0} display='flex' mbs={12} alignItems='center' justifyContent='center'>
					{isLoading ? (
						<>
							<Skeleton variant='rect' height='x28' width='x28' borderRadius='x4' mi={2} />
							<Skeleton variant='rect' height='x28' width='x28' borderRadius='x4' mi={2} />
							<Skeleton variant='rect' height='x28' width='x28' borderRadius='x4' mi={2} />
						</>
					) : (
						actions
					)}
				</Box>
			</Box>
			<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} mis={24} width='1px'>
				<Box mbe={4} withTruncatedText display='flex' alignItems='center'>
					{isLoading ? <Skeleton width='100%' /> : <UserCardUsername status={status} name={name} />}
					{nickname && (
						<Box flexGrow={1} flexShrink={1} flexBasis={0} title={nickname} color='hint' mis={4} fontScale='p2' withTruncatedText>
							({nickname})
						</Box>
					)}
				</Box>
				{customStatus && (
					<UserCardInfo mbe={16}>
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
				{!isLoading && open && !isLayoutEmbedded && <a onClick={open}>{t('See_full_profile')}</a>}
			</Box>
			{onClose && (
				<Box>
					<IconButton small title={t('Close')} icon='cross' onClick={onClose} />
				</Box>
			)}
		</UserCardContainer>
	);
});

export default UserCard;
