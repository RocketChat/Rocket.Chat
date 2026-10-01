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
import type { CallParticipantControlsProps } from '../CallParticipantControls/CallParticipantControls';
import CallParticipantControls from '../CallParticipantControls/CallParticipantControls';
import CallParticipantStatus from '../CallParticipantStatus/CallParticipantStatus';

type CallMemberItemProps = {
	member: ConferenceMember;
	hasChatAccess: boolean;
	/** Whether this member's ring has been asked for and not yet answered. */
	ringing?: boolean;
	/**
	 * What the provider lets this row do, for a member it has in the call. Absent for everyone else: a member
	 * the provider does not have is one no request could name.
	 */
	controls?: Omit<CallParticipantControlsProps, 'name'>;
	onRing: (memberId: string) => void;
};

const statusLabel: Record<Exclude<ConferenceMemberStatus, 'joined'>, string> = {
	left: 'Left',
	declined: 'Declined',
	invited: 'Waiting_for_answer',
};

const CallMemberItem = ({ member, hasChatAccess, ringing: ringRequested = false, controls, onRing }: CallMemberItemProps) => {
	const { t } = useTranslation();
	// `video-conference.ring` refuses without the permission, so a caller who lacks it is offered nothing to press.
	const { useRealName, canRingUsers } = useConferenceViewer();
	const { renderMemberStatus } = useConferenceSlots();
	const [nameOrUsername, displayUsername] = getUserDisplayNames(member.name, member.username, useRealName);
	const status = getConferenceMemberStatus(member);

	const ringing = useIsRinging(member);

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
					{controls && <CallParticipantStatus participant={controls.participant} />}
					{!hasChatAccess && (
						// `Icon` renders `aria-hidden`, so the fact has to go in as text to be announced at all.
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
			{controls && (
				<OptionColumn>
					<CallParticipantControls name={nameOrUsername} {...controls} />
				</OptionColumn>
			)}
		</Option>
	);
};

export default CallMemberItem;
