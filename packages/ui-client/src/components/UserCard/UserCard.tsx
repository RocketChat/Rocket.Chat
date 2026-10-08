import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ReactNode } from 'react';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';
import { HoverCard, HoverCardActions, HoverCardHeader, HoverCardInfoItem, HoverCardInfoList, HoverCardSection } from '../HoverCard';
import { MarkdownTextContext } from '../MarkdownTextContext';
import * as Status from '../UserStatus';
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

export type UserCardProps = {
	user?: {
		nickname?: string;
		name?: string;
		username?: string;
		title?: string;
		etag?: string;
		customStatus?: ReactNode;
		roles?: ReactNode;
		status?: ReactNode;
		localTime?: ReactNode;
	};
	actions?: ReactNode;
	onOpenUserInfo?: () => void;
};

const UserCard = ({
	user: { name, username, title, etag, customStatus, roles, status = <Status.Offline />, localTime, nickname } = {},
	actions,
	onOpenUserInfo,
}: UserCardProps) => {
	const { t } = useTranslation();
	const isLayoutEmbedded = useEmbeddedLayout();
	const MarkdownText = useContext(MarkdownTextContext);

	return (
		<HoverCard aria-label={t('User_card')}>
			<HoverCardSection>
				<HoverCardHeader
					avatar={username && <UserAvatar username={username} etag={etag} size='x36' />}
					title={
						<Box display='flex' alignItems='center' withTruncatedText>
							<UserCardUsername is='h2' flexGrow={0} flexBasis='auto' status={status} name={name} />
							{nickname && (
								<Box flexShrink={1} title={nickname} color='hint' marginInlineStart='x4' fontScale='p1' withTruncatedText>
									({nickname})
								</Box>
							)}
						</Box>
					}
					subtitle={
						customStatus && (
							<Box fontScale='p2' color='default' paddingInlineStart='x4' withTruncatedText>
								{typeof customStatus === 'string' ? (
									<MarkdownText withTruncatedText variant='inlineWithoutBreaks' content={customStatus} parseEmoji={true} />
								) : (
									customStatus
								)}
							</Box>
						)
					}
				/>
				<Box display='flex' flexDirection='column' marginBlockStart='x18'>
					{(roles || localTime || username || title) && (
						<HoverCardInfoList>
							{username && name !== username && (
								<HoverCardInfoItem icon='at' label={t('Username')}>
									{username}
								</HoverCardInfoItem>
							)}
							{title && (
								<HoverCardInfoItem icon='business' label={t('Title')}>
									<Box is='span' display='block' withTruncatedText title={title}>
										{title}
									</Box>
								</HoverCardInfoItem>
							)}
							{roles && (
								<HoverCardInfoItem icon='shield-blank' label={t('Roles')}>
									<UserCardRoles>{roles}</UserCardRoles>
								</HoverCardInfoItem>
							)}
							{localTime && (
								<HoverCardInfoItem icon='clock' label={t('Local_Time')}>
									{localTime}
								</HoverCardInfoItem>
							)}
						</HoverCardInfoList>
					)}
					{onOpenUserInfo && !isLayoutEmbedded && (
						<HoverCardInfoItem icon='link'>
							<Box
								is='button'
								type='button'
								className={linkButtonStyle}
								fontScale='p2'
								color='info'
								textDecorationLine='underline'
								onClick={onOpenUserInfo}
							>
								{t('Full_profile')}
							</Box>
						</HoverCardInfoItem>
					)}
				</Box>
				{actions && (
					<Box display='flex' flexDirection='column' marginBlockStart='x24'>
						<HoverCardActions aria-label={t('User_card_actions')}>{actions}</HoverCardActions>
					</Box>
				)}
			</HoverCardSection>
		</HoverCard>
	);
};

export default UserCard;
