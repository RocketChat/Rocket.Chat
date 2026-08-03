import { Box, IconButton, Tag } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserDisplayName } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import type { ConferenceMember } from './hooks/useCallOutcome';
import type { ConferenceMemberStatus } from '../../../lib/videoConference/memberStatus';
import { canRingConferenceMember, getConferenceMemberStatus } from '../../../lib/videoConference/memberStatus';

type CallMemberItemProps = {
	member: ConferenceMember;
	/** Membership grants no room access, so a member can be in the call and unable to read its chat. */
	hasChatAccess: boolean;
	ringing?: boolean;
	onRing: (memberId: string) => void;
};

const statusLabel: Record<ConferenceMemberStatus, string> = {
	joined: 'In_call',
	left: 'Left',
	declined: 'Declined',
	invited: 'Waiting_for_answer',
};

const CallMemberItem = ({ member, hasChatAccess, ringing, onRing }: CallMemberItemProps) => {
	const { t } = useTranslation();
	const displayName = useUserDisplayName(member);
	const status = getConferenceMemberStatus(member);

	return (
		<Box display='flex' alignItems='center' paddingInline={12} paddingBlock={8}>
			<UserAvatar username={member.username} size='x28' />
			<Box marginInlineStart={8} flexGrow={1} minWidth={0}>
				<Box fontScale='p2m' color='default' withTruncatedText>
					{displayName}
				</Box>
				<Box display='flex' alignItems='center' marginBlockStart={2}>
					<Box fontScale='c1' color={status === 'joined' ? 'status-font-on-success' : 'hint'}>
						{t(statusLabel[status])}
					</Box>
					{/* Worth its own tag rather than a footnote: it is the one thing about a member that the other
					    participants can do something about, from the notice in the chat panel. */}
					{!hasChatAccess && (
						<Box marginInlineStart={4}>
							<Tag>{t('No_chat_access')}</Tag>
						</Box>
					)}
				</Box>
			</Box>
			{canRingConferenceMember(member) && (
				<IconButton
					small
					icon='phone'
					disabled={ringing}
					title={t('Ring__name__', { name: displayName })}
					aria-label={t('Ring__name__', { name: displayName })}
					onClick={() => onRing(member._id)}
				/>
			)}
		</Box>
	);
};

export default CallMemberItem;
