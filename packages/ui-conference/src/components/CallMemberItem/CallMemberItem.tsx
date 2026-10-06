import { getUserDisplayNames } from '@rocket.chat/core-typings';
import {
	Icon,
	IconButton,
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemIcon,
	ItemMedia,
	ItemRow,
	ItemTitle,
} from '@rocket.chat/fuselage';
import { ITEM_MEDIA_SIZE, UserAvatar } from '@rocket.chat/ui-avatar';
import type { ReactNode } from 'react';
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
	/** Membership grants no room access, so a member can be in the call and unable to read its chat. */
	hasChatAccess: boolean;
	/** Whether this member's ring has been asked for and not yet answered. */
	ringing?: boolean;
	/**
	 * What the provider lets this row do, for a member it has in the call. Absent for everyone else: a member
	 * the provider does not have is one no request could name.
	 */
	controls?: Omit<CallParticipantControlsProps, 'name'>;
	/** Whether they are waiting to speak. */
	handRaised?: boolean;
	/** Whether their microphone is already off, in which case there is nothing to ask for. */
	muted?: boolean;
	/** Asks them to mute. Absent where the call cannot carry the request. */
	onMute?: (memberId: string) => void;
	/** Their microphone level, for a call whose audio this window holds. */
	activity?: ReactNode;
	onRing: (memberId: string) => void;
};

/** Only shown for members who aren't in the call — for those, presence in the call is the whole story. */
const statusLabel: Record<Exclude<ConferenceMemberStatus, 'joined'>, string> = {
	left: 'Left',
	declined: 'Declined',
	invited: 'Waiting_for_answer',
};

const CallMemberItem = ({
	member,
	hasChatAccess,
	ringing: ringRequested = false,
	controls,
	handRaised,
	muted,
	activity,
	onRing,
	onMute,
}: CallMemberItemProps) => {
	const { t } = useTranslation();
	// `video-conference.ring` refuses without the permission, so a caller who lacks it is offered nothing to press.
	const { uid: ownUserId, useRealName, canRingUsers } = useConferenceViewer();
	const { renderMemberStatus } = useConferenceSlots();
	const [nameOrUsername, displayUsername] = getUserDisplayNames(member.name, member.username, useRealName);
	const status = getConferenceMemberStatus(member);

	const ringing = useIsRinging(member);

	const canRing = status !== 'joined' && !ringing;
	const isLive = status === 'joined' && !muted;
	const canMute = isLive && member._id !== ownUserId && !!onMute;
	const showActivity = isLive && !!activity;

	return (
		<Item role='listitem' inset='lg'>
			<ItemMedia>
				<UserAvatar username={member.username} size={ITEM_MEDIA_SIZE.medium} />
			</ItemMedia>
			{renderMemberStatus && <ItemIcon>{renderMemberStatus(member._id)}</ItemIcon>}
			<ItemContent>
				<ItemRow>
					<ItemTitle>
						{nameOrUsername} {displayUsername && <ItemDescription inline>{displayUsername}</ItemDescription>}
					</ItemTitle>
					{/* What a provider running in its own frame says about them. */}
					{controls && <CallParticipantStatus participant={controls.participant} />}
					{!hasChatAccess && (
						<ItemIcon label={t('No_chat_access')} title={t('No_chat_access')}>
							<Icon name='balloon-off' size='x16' color='hint' />
						</ItemIcon>
					)}
					{handRaised && (
						<ItemIcon label={t('Raised_hand')} title={t('Raised_hand')}>
							<span aria-hidden>✋</span>
						</ItemIcon>
					)}
				</ItemRow>
				{status !== 'joined' && <ItemDescription>{t(ringing ? 'Ringing' : statusLabel[status])}</ItemDescription>}
			</ItemContent>
			{(canMute || showActivity || (canRingUsers && canRing) || controls) && (
				<ItemActions>
					{/* A live microphone, and for anyone but the reader a way to ask it for silence. A muted one says nothing:
					    silence is what everyone already hears. */}
					{canMute && (
						<IconButton
							secondary
							small
							icon='mic-off'
							title={t('Mute__name__', { name: nameOrUsername })}
							aria-label={t('Mute__name__', { name: nameOrUsername })}
							onClick={() => onMute?.(member._id)}
						/>
					)}
					{showActivity && activity}
					{canRingUsers && canRing && (
						// The button stays until the server says the phone is ringing, which is a round trip away — so
						// while the request is out it refuses a second one. Clicking three times rang three times.
						<IconButton
							small
							icon='phone'
							title={t('Ring__name__', { name: nameOrUsername })}
							aria-label={t('Ring__name__', { name: nameOrUsername })}
							disabled={ringRequested}
							onClick={() => onRing(member._id)}
						/>
					)}
					{controls && <CallParticipantControls name={nameOrUsername} {...controls} />}
				</ItemActions>
			)}
		</Item>
	);
};

export default CallMemberItem;
