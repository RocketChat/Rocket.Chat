import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ReactNode } from 'react';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { useEmbeddedLayout } from '../../hooks/useEmbeddedLayout';
import { HoverCard, HoverCardActions, HoverCardBand, HoverCardInfoItem, HoverCardInfoList, HoverCardSection } from '../HoverCard';
import { MarkdownTextContext } from '../MarkdownTextContext';
import * as Status from '../UserStatus';
import UserCardHeader from './UserCardHeader';
import UserCardRoles from './UserCardRoles';

export type UserCardProps = {
	user?: {
		nickname?: string;
		name?: string;
		username?: string;
		etag?: string;
		customStatus?: ReactNode;
		roles?: ReactNode;
		workspaceRoles?: ReactNode;
		status?: ReactNode;
		localTime?: ReactNode;
	};
	actions?: ReactNode;
	onOpenUserInfo?: () => void;
};

const UserCard = ({
	user: { name, username, etag, customStatus, roles, workspaceRoles, status = <Status.Offline />, localTime, nickname } = {},
	actions,
	onOpenUserInfo,
}: UserCardProps) => {
	const { t } = useTranslation();
	const isLayoutEmbedded = useEmbeddedLayout();
	const MarkdownText = useContext(MarkdownTextContext);
	const showUsername = !!username && name !== username;
	const showProfileLink = !!onOpenUserInfo && !isLayoutEmbedded;

	return (
		<HoverCard aria-label={t('User_card')}>
			{workspaceRoles && <HoverCardBand label={t('Workspace_roles')}>{workspaceRoles}</HoverCardBand>}
			<HoverCardSection>
				<UserCardHeader
					avatar={username && <UserAvatar username={username} etag={etag} size='x36' />}
					name={name}
					status={status}
					nickname={nickname}
					subtitle={
						customStatus &&
						(typeof customStatus === 'string' ? (
							<MarkdownText withTruncatedText variant='inlineWithoutBreaks' content={customStatus} parseEmoji={true} />
						) : (
							customStatus
						))
					}
				/>
				{(showUsername || roles || localTime || showProfileLink) && (
					<Box marginBlockStart='x16'>
						<HoverCardInfoList>
							{showUsername && (
								<HoverCardInfoItem icon='at' label={t('Username')}>
									{username}
								</HoverCardInfoItem>
							)}
							{roles && (
								<HoverCardInfoItem icon='shield-blank' label={t('Room_roles')}>
									<UserCardRoles>{roles}</UserCardRoles>
								</HoverCardInfoItem>
							)}
							{localTime && (
								<HoverCardInfoItem icon='clock' label={t('Local_Time')}>
									{localTime}
								</HoverCardInfoItem>
							)}
							{showProfileLink && (
								<HoverCardInfoItem icon='link' onClick={onOpenUserInfo}>
									<Box is='span' color='info' textDecorationLine='underline'>
										{t('Full_profile')}
									</Box>
								</HoverCardInfoItem>
							)}
						</HoverCardInfoList>
					</Box>
				)}
				{actions && (
					<Box display='flex' flexDirection='column' marginBlockStart='x24'>
						<HoverCardActions aria-label={t('User_card_actions')} stretch='equal'>
							{actions}
						</HoverCardActions>
					</Box>
				)}
			</HoverCardSection>
		</HoverCard>
	);
};

export default UserCard;
