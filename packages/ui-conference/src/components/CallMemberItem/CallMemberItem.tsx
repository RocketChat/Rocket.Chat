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
		<Item role='listitem' size='medium' inset='lg'>
			<ItemMedia>
				<UserAvatar username={member.username} size='x28' />
			</ItemMedia>
			{renderMemberStatus && <ItemIcon>{renderMemberStatus(member._id)}</ItemIcon>}
			<ItemContent>
				<ItemRow>
					<ItemTitle>
						{nameOrUsername} {displayUsername && <ItemDescription inline>{displayUsername}</ItemDescription>}
					</ItemTitle>
					{controls && <CallParticipantStatus participant={controls.participant} />}
					{!hasChatAccess && (
						<ItemIcon label={t('No_chat_access')} title={t('No_chat_access')}>
							<Icon name='balloon-off' size='x16' color='hint' />
						</ItemIcon>
					)}
				</ItemRow>
				{status !== 'joined' && <ItemDescription>{t(ringing ? 'Ringing' : statusLabel[status])}</ItemDescription>}
			</ItemContent>
			{((canRingUsers && canRing) || controls) && (
				<ItemActions>
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
