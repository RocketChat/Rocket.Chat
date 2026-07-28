import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEmbeddedLayout } from '@rocket.chat/ui-client';
import type { ReactNode, ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';

import MarkdownText from '../MarkdownText';
import * as Status from '../UserStatus';
import UserCardActions from './UserCardActions';
import UserCardDialog from './UserCardDialog';
import UserCardListItem from './UserCardListItem';
import UserCardRoles from './UserCardRoles';
import UserCardUsername from './UserCardUsername';

const clampStyle = css`
	display: -webkit-box;
	overflow: hidden;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	word-break: break-word;
`;

const linkButtonStyle = css`
	padding: 0;
	border: none;
	background: none;
	cursor: pointer;
`;

export type UserCardProps = {
	user?: {
		nickname?: string;
		name?: string;
		username?: string;
		etag?: string;
		customStatus?: ReactNode;
		roles?: ReactNode;
		workspaceRoles?: ReactNode;
		bio?: ReactNode;
		status?: ReactNode;
		localTime?: ReactNode;
	};
	actions?: ReactNode;
	onOpenUserInfo?: () => void;
} & ComponentProps<typeof UserCardDialog>;

const UserCard = ({
	user: { name, username, etag, customStatus, roles, workspaceRoles, bio, status = <Status.Offline />, localTime, nickname } = {},
	actions,
	onOpenUserInfo,
	...props
}: UserCardProps) => {
	const { t } = useTranslation();
	const isLayoutEmbedded = useEmbeddedLayout();

	return (
		<UserCardDialog aria-label={t('User_card')} {...props}>
			{workspaceRoles && (
				<Box
					marginBlockStart='neg-x24'
					marginInline='neg-x16'
					marginBlockEnd='x16'
					paddingBlock='x8'
					paddingInline='x16'
					backgroundColor='tint'
					fontScale='c1'
					color='default'
					withTruncatedText
					aria-label={t('Roles')}
				>
					{workspaceRoles}
				</Box>
			)}
			<Box display='flex' alignItems='flex-start'>
				<Box display='flex' flexGrow={1} flexShrink={1} alignItems='center' withTruncatedText>
					{username && <UserAvatar username={username} etag={etag} size='x36' />}
					<Box display='flex' flexDirection='column' flexGrow={1} flexShrink={1} marginInlineStart='x4' withTruncatedText>
						<Box display='flex' alignItems='center' withTruncatedText>
							<UserCardUsername is='h2' status={status} name={name} />
							{nickname && (
								<Box
									flexGrow={1}
									flexShrink={1}
									flexBasis={0}
									title={nickname}
									color='hint'
									marginInlineStart='x4'
									fontScale='p2'
									withTruncatedText
								>
									({nickname})
								</Box>
							)}
						</Box>
						{customStatus && (
							<Box fontScale='p2' color='default' paddingInlineStart='x4' withTruncatedText>
								{typeof customStatus === 'string' ? (
									<MarkdownText withTruncatedText variant='inlineWithoutBreaks' content={customStatus} parseEmoji={true} />
								) : (
									customStatus
								)}
							</Box>
						)}
					</Box>
				</Box>
			</Box>
			<Box display='flex' flexDirection='column' marginBlockStart='x18'>
				{(roles || localTime || bio) && (
					<Box is='dl' display='flex' flexDirection='column' margin={0}>
						{roles && (
							<UserCardListItem icon='user' label={t('Roles')}>
								<UserCardRoles>{roles}</UserCardRoles>
							</UserCardListItem>
						)}
						{localTime && (
							<UserCardListItem icon='clock' label={t('Local_Time')}>
								{localTime}
							</UserCardListItem>
						)}
						{bio && (
							<UserCardListItem label={t('Bio')}>
								<Box className={clampStyle}>{typeof bio === 'string' ? <MarkdownText variant='inline' content={bio} /> : bio}</Box>
							</UserCardListItem>
						)}
					</Box>
				)}
				{onOpenUserInfo && !isLayoutEmbedded && (
					<UserCardListItem icon='link'>
						<Box
							is='button'
							className={linkButtonStyle}
							fontScale='p2'
							color='info'
							textDecorationLine='underline'
							onClick={onOpenUserInfo}
						>
							{t('See_member_profile')}
						</Box>
					</UserCardListItem>
				)}
			</Box>
			{actions && (
				<Box display='flex' flexDirection='column' marginBlockStart='x24'>
					<UserCardActions aria-label={t('User_card_actions')}>{actions}</UserCardActions>
				</Box>
			)}
		</UserCardDialog>
	);
};

export default UserCard;
