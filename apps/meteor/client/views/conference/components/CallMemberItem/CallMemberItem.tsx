import { VisuallyHidden } from '@react-aria/visually-hidden';
import { Box, Icon, IconButton, Option, OptionAvatar, OptionColumn, OptionContent } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { usePermission, useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { VoiceActivity } from '@rocket.chat/ui-voip';
import { useTranslation } from 'react-i18next';

import { getUserDisplayNames } from '../../../../../lib/getUserDisplayNames';
import type { ConferenceMemberStatus } from '../../../../../lib/videoConference/memberStatus';
import { canRingConferenceMember, getConferenceMemberStatus } from '../../../../../lib/videoConference/memberStatus';
import { ReactiveUserStatus } from '../../../../components/UserStatus';
import { useIsRinging } from '../../../../hooks/useRinging';
import type { ConferenceMember } from '../../hooks/useConferenceEmbedded';

type CallMemberItemProps = {
	member: ConferenceMember;
	/** Membership grants no room access, so a member can be in the call and unable to read its chat. */
	hasChatAccess: boolean;
	/** Whether this member's ring has been asked for and not yet answered. */
	ringing?: boolean;
	/** Whether they are waiting to speak. The queue's order is stated by the call's own header, not here. */
	handRaised?: boolean;
	/** Whether their microphone is already off, in which case there is nothing to ask for. */
	muted?: boolean;
	/** Their microphone, so the row can show it moving. Absent for anyone the call has no audio from. */
	audioStream?: MediaStream | null;
	/**
	 * Asks them to mute themselves. Absent where the transport cannot carry the request; the row decides for
	 * itself whether there is anyone here to ask.
	 */
	onMute?: (memberId: string) => void;
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
	handRaised,
	muted,
	audioStream,
	onRing,
	onMute,
}: CallMemberItemProps) => {
	const { t } = useTranslation();
	const ownUserId = useUserId();
	const useRealName = useSetting('UI_Use_Real_Name', false);
	// Ringing is a workspace-level permission, and `video-conference.ring` refuses without it — so a caller who
	// does not have it is offered nothing to press rather than a button that can only fail.
	const canRingUsers = usePermission('videoconf-ring-users');
	const [nameOrUsername, displayUsername] = getUserDisplayNames(member.name, member.username, useRealName);
	const status = getConferenceMemberStatus(member);

	const ringing = useIsRinging(member);

	return (
		<Option>
			<OptionAvatar>
				<UserAvatar username={member.username} size='x28' />
			</OptionAvatar>
			<OptionColumn>
				<ReactiveUserStatus uid={member._id} />
			</OptionColumn>
			<OptionContent>
				<Box display='flex' alignItems='center'>
					<Box withTruncatedText>{nameOrUsername}</Box>
					{displayUsername && (
						<Box marginInlineStart={4} color='hint' withTruncatedText>
							{displayUsername}
						</Box>
					)}
					{/* Beside the name rather than beneath it: it qualifies who this person is in the call, and a
					    second line pushed the rows apart for something most members never carry. */}
					{!hasChatAccess && (
						// The icon is decorative — `Icon` renders `aria-hidden`, so the label it carried was read by
						// nothing. What this row is announced as is its own content, so the fact goes in as text: seen
						// as a struck-through balloon, heard as the sentence, hovered as the tooltip.
						<Box marginInlineStart={4} display='flex' color='hint' title={t('No_chat_access')}>
							<Icon name='balloon-off' size='x16' />
							<VisuallyHidden>{t('No_chat_access')}</VisuallyHidden>
						</Box>
					)}
					{handRaised && (
						<Box marginInlineStart={4} display='flex' title={t('Raised_hand')} aria-label={t('Raised_hand')}>
							<Box is='span' aria-hidden>
								✋
							</Box>
						</Box>
					)}
				</Box>
				{status !== 'joined' && (
					<Box fontScale='c1' color='hint'>
						{t(ringing ? 'Ringing' : statusLabel[status])}
					</Box>
				)}
			</OptionContent>
			{/* A live microphone, and — for anyone but the reader — the way to ask it for silence.
			    A muted one says nothing at all. There is no state to report: silence is what everyone else in the call
			    already hears, so a crossed-out mic in this column would only be repeating it, once per row, for the
			    rows there is least to say about. What the column is for is the opposite case — a mic that is on, where
			    the useful question is whether it is picking anything up, and where asking for silence is a thing
			    someone might actually want to do.
			    Muting yourself is what the control on the call's own bar is for, so the reader gets the level alone;
			    asking yourself for silence through a list of other people reads as a stranger act. */}
			{status === 'joined' && !muted && (
				<>
					{member._id !== ownUserId && onMute && (
						<OptionColumn>
							<IconButton
								secondary
								small
								icon='mic-off'
								title={t('Mute__name__', { name: nameOrUsername })}
								aria-label={t('Mute__name__', { name: nameOrUsername })}
								onClick={() => onMute(member._id)}
							/>
						</OptionColumn>
					)}
					<OptionColumn>
						<Box display='flex'>
							<VoiceActivity stream={audioStream} size={14} badge />
						</Box>
					</OptionColumn>
				</>
			)}
			{canRingUsers && canRingConferenceMember(member) && (
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
