import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
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

const linkButtonStyle = css`
	padding: 0;
	border: none;
	background: none;
	cursor: pointer;

	&:focus-visible {
		outline: 0.125rem solid ${Palette.stroke['stroke-highlight']};
		outline-offset: 0.125rem;
	}
`;

const srOnly = css`
	position: absolute;
	overflow: hidden;
	clip: rect(0 0 0 0);
	width: 1px;
	height: 1px;
	padding: 0;
	border: 0;
	margin: -1px;
	white-space: nowrap;
`;

export type UserCardProps = {
	user?: {
		nickname?: string;
		name?: string;
		username?: string;
		title?: string;
		etag?: string;
		customStatus?: ReactNode;
		roles?: ReactNode;
		workspaceRoles?: ReactNode;
		status?: ReactNode;
		localTime?: ReactNode;
	};
	actions?: ReactNode;
	onOpenUserInfo?: () => void;
} & ComponentProps<typeof UserCardDialog>;

const UserCard = ({
	user: { name, username, title, etag, customStatus, roles, workspaceRoles, status = <Status.Offline />, localTime, nickname } = {},
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
				>
					<Box is='span' className={srOnly}>{`${t('Workspace_roles')}: `}</Box>
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
				{(roles || localTime || username || title) && (
					<Box is='dl' display='flex' flexDirection='column' margin={0}>
						{username && name !== username && (
							<UserCardListItem icon='at' label={t('Username')}>
								{username}
							</UserCardListItem>
						)}
						{title && (
							<UserCardListItem icon='card' label={t('Title')}>
								{title}
							</UserCardListItem>
						)}
						{roles && (
							<UserCardListItem icon='shield-blank' label={t('Room_roles')}>
								<UserCardRoles>{roles}</UserCardRoles>
							</UserCardListItem>
						)}
						{localTime && (
							<UserCardListItem icon='clock' label={t('Local_Time')}>
								{localTime}
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
