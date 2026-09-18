import { VisuallyHidden } from '@react-aria/visually-hidden';
import { getUserDisplayNames } from '@rocket.chat/core-typings';
import { Box, Icon, IconButton, Option, OptionAvatar, OptionColumn, OptionContent } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from 'react-i18next';

import { useConferenceSlots, useConferenceViewer } from '../../context/ConferenceContext';
import type { ConferenceMember } from '../../context/definitions';
import { useIsRinging } from '../../hooks/useRinging';
import type { ConferenceMemberStatus } from '../../lib/memberStatus';
import { getConferenceMemberStatus } from '../../lib/memberStatus';

type CallMemberItemProps = {
	member: ConferenceMember;
	hasChatAccess: boolean;
	/** Whether this member's ring has been asked for and not yet answered. */
	ringing?: boolean;
	onRing: (memberId: string) => void;
};

const statusLabel: Record<Exclude<ConferenceMemberStatus, 'joined'>, string> = {
	left: 'Left',
	declined: 'Declined',
	invited: 'Waiting_for_answer',
};

const CallMemberItem = ({ member, hasChatAccess, ringing: ringRequested = false, onRing }: CallMemberItemProps) => {
	const { t } = useTranslation();
	// Both come with the conference rather than being read here: a setting and a permission belong to the
	// workspace, and a row that asked for them itself could not be drawn without one.
	// Ringing is a workspace-level permission, and `video-conference.ring` refuses without it — so a caller who
	// does not have it is offered nothing to press rather than a button that can only fail.
	const { useRealName, canRingUsers } = useConferenceViewer();
	const { renderMemberStatus } = useConferenceSlots();
	const [nameOrUsername, displayUsername] = getUserDisplayNames(member.name, member.username, useRealName);
	const status = getConferenceMemberStatus(member);

	const ringing = useIsRinging(member);

	// Asked of what this row already knows rather than of the member again: a ring is on offer for anyone who is
	// neither in the call nor currently being rung, and both of those are answered above.
	const canRing = status !== 'joined' && !ringing;

	return (
		<Option>
			<OptionAvatar>
				<UserAvatar username={member.username} size='x28' />
			</OptionAvatar>
			{renderMemberStatus && <OptionColumn>{renderMemberStatus(member._id)}</OptionColumn>}
			<OptionContent>
				<Box display='flex' alignItems='center'>
					<Box withTruncatedText>{nameOrUsername}</Box>
					{displayUsername && (
						<Box marginInlineStart={4} color='hint' withTruncatedText>
							{displayUsername}
						</Box>
					)}
					{!hasChatAccess && (
						// The icon is decorative — `Icon` renders `aria-hidden`, so the label it carried was read by
						// nothing. What this row is announced as is its own content, so the fact goes in as text: seen
						// as a struck-through balloon, heard as the sentence, hovered as the tooltip.
						<Box marginInlineStart={4} display='flex' color='hint' title={t('No_chat_access')}>
							<Icon name='balloon-off' size='x16' />
							<VisuallyHidden>{t('No_chat_access')}</VisuallyHidden>
						</Box>
					)}
				</Box>
				{status !== 'joined' && (
					<Box fontScale='c1' color='hint'>
						{t(ringing ? 'Ringing' : statusLabel[status])}
					</Box>
				)}
			</OptionContent>
			{canRingUsers && canRing && (
				<OptionColumn>
					{/* The button stays until the server says the phone is ringing, which is a round trip away — so
					    while the request is out it refuses a second one. Clicking three times rang three times. */}
					<IconButton
						small
						icon='phone'
						title={t('Ring__name__', { name: nameOrUsername })}
						aria-label={t('Ring__name__', { name: nameOrUsername })}
						disabled={ringRequested}
						onClick={() => onRing(member._id)}
					/>
				</OptionColumn>
			)}
		</Option>
	);
};

export default CallMemberItem;
