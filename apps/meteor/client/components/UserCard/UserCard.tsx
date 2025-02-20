import { css } from '@rocket.chat/css-in-js';
import { Box, Button, IconButton } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ReactNode, ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';
import MarkdownText from '../MarkdownText';
import * as Status from '../UserStatus';
import UserCardActions from './UserCardActions';
import UserCardDialog from './UserCardDialog';
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
	user?: {
		nickname?: string;
		name?: string;
		username?: string;
		etag?: string;
		customStatus?: ReactNode;
		roles?: ReactNode;
		bio?: ReactNode;
		status?: ReactNode;
		localTime?: ReactNode;
	};
	actions?: ReactNode;
	onOpenUserInfo?: () => void;
	onClose?: () => void;
} & ComponentProps<typeof UserCardDialog>;

const UserCard = ({
	user: { name, username, etag, customStatus, roles, bio, status = <Status.Offline />, localTime, nickname } = {},
	actions,
	onOpenUserInfo,
	onClose,
	...props
}: UserCardProps) => {
	const { t } = useTranslation();
	const isLayoutEmbedded = useEmbeddedLayout();

	return (
		<UserCardDialog data-qa='UserCard' {...props}>
			<div>
				{username && <UserAvatar username={username} etag={etag} size='x124' />}
				<Box flexGrow={0} display='flex' mbs={12} alignItems='center' justifyContent='center'>
					<UserCardActions aria-label={t('User_card_actions')}>{actions}</UserCardActions>
				</Box>
			</div>
			<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} mis={16} width='1px'>
				<Box mbe={4} withTruncatedText display='flex' alignItems='center'>
					<UserCardUsername status={status} name={name} />
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
				{onOpenUserInfo && !isLayoutEmbedded && (
					<div>
						<Button small onClick={onOpenUserInfo}>
							{t('See_full_profile')}
						</Button>
					</div>
				)}
			</Box>
			{onClose && <IconButton mis={16} small aria-label={t('Close')} icon='cross' onClick={onClose} />}
		</UserCardDialog>
	);
};

export default UserCard;
