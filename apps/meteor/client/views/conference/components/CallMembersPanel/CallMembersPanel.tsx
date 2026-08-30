import { Box, Button } from '@rocket.chat/fuselage';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { hasConferenceChatAccess } from '../../../../../lib/videoConference/chatAccess';
import { MembersListDivider } from '../../../room/contextualBar/RoomMembers/MembersListDivider';
import type { ConferenceChatAccess, ConferenceMember } from '../../hooks/useConferenceEmbedded';
import type { ProviderPluginControls } from '../../hooks/useProviderPlugin';
import type { CallParticipantEntry } from '../../lib/callParticipants';
import { composeCallParticipants } from '../../lib/callParticipants';
import AddParticipantsModal from '../AddParticipantsModal/AddParticipantsModal';
import CallMemberItem from '../CallMemberItem/CallMemberItem';
import CallPanelHeader from '../CallPanelHeader';
import CallParticipantItem from '../CallParticipantItem/CallParticipantItem';

type CallMembersPanelProps = {
	callId: string;
	rid?: string;
	members: ConferenceMember[];
	/** Where the chat lives and who among the members can't read it — membership grants no room access. */
	chatAccess?: ConferenceChatAccess;
	/**
	 * What the provider says about the call, when a plugin in its page is speaking. Absent for a provider
	 * without one, which is the panel this has always been: our own members, and nothing to press on them.
	 */
	provider?: ProviderPluginControls;
	/** Who currently has their hand up, so the list says it too rather than leaving it to the tiles. */
	raisedHands?: Set<string>;
	/** Whose microphone is already off. There is nothing to ask of them, so they are not asked. */
	mutedMembers?: Set<string>;
	/** Each member's microphone, by id, so a row can show it moving. */
	audioStreams?: Map<string, MediaStream | undefined>;
	/** Asks a member to mute themselves. Absent where the transport cannot carry the request. */
	onMute?: (memberId: string) => void;
	onClose: () => void;
};

const NO_PARTICIPANTS: ProviderPluginControls['participants'] = [];

/**
 * Who is on the call and where each of them stands, shaped like the room's own members list so the two read the
 * same way.
 *
 * Two things can tell it what a row is doing, and a call has one or the other. A provider running in its own
 * frame answers through its plugin — a roster, and the flags saying what may be asked of each person. A call
 * running in this window answers directly, with the media it already holds: a live microphone to meter, a hand
 * that went up. Neither is present for a provider with no plugin, and the panel is then what it always was.
 *
 * Split in two, because the two halves answer different questions: who is here, and who still isn't.
 */
const CallMembersPanel = ({
	callId,
	rid,
	members,
	chatAccess,
	provider,
	raisedHands,
	mutedMembers,
	audioStreams,
	onMute,
	onClose,
}: CallMembersPanelProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const ring = useEndpoint('POST', '/v1/video-conference.ring');

	const participants = provider?.participants ?? NO_PARTICIPANTS;

	// Two lists that describe the same call and contain different people — see `composeCallParticipants` for
	// which of them is the authority on what.
	const { waiting, present, absent } = useMemo(() => composeCallParticipants(members, participants), [members, participants]);

	// Who has been rung and not yet answered for — a set rather than the mutation's own `variables`, which holds
	// only the most recent call: ringing a second member while the first request was still out put that one back
	// in reach, which is the double ring this was added to prevent.
	const [ringingMembers, setRingingMembers] = useState<string[]>([]);

	// The conference stream tells every participant when membership moves, so the list refreshes itself and
	// there is nothing to refetch here on success.
	const { mutate: ringMember } = useMutation({
		mutationFn: (memberId: string) => ring({ callId, userId: memberId }),
		onMutate: (memberId) => setRingingMembers((current) => [...current, memberId]),
		onSettled: (_data, _error, memberId) => setRingingMembers((current) => current.filter((id) => id !== memberId)),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const renderEntry = ({ key, member, participant }: CallParticipantEntry) => {
		const controls =
			provider && participant
				? {
						participant,
						features: provider.features,
						actions: provider.actions,
						self: provider.self,
						// The viewer's own row, which the provider names for us — the only thing that can, since our
						// membership and the provider's roster are different lists of different things.
						isSelf: provider.self?.participantUuid === participant.uuid,
					}
				: undefined;

		if (member) {
			return (
				<CallMemberItem
					key={key}
					member={member}
					hasChatAccess={hasConferenceChatAccess(chatAccess, member._id)}
					// The row stops offering to ring once the member is ringing, but that is the server's answer coming
					// back — until it does, this is what says the ask is already on its way.
					ringing={ringingMembers.includes(member._id)}
					controls={controls}
					handRaised={raisedHands?.has(member._id)}
					muted={mutedMembers?.has(member._id)}
					audioStream={audioStreams?.get(member._id)}
					onRing={ringMember}
					onMute={onMute}
				/>
			);
		}

		// Only the provider's own roster puts a row here, so there is always something behind it.
		return controls ? <CallParticipantItem key={key} {...controls} /> : null;
	};

	return (
		<>
			<CallPanelHeader title={t('People')} onClose={onClose}>
				{rid && (
					<Button
						small
						icon='user-plus'
						onClick={() => setModal(<AddParticipantsModal callId={callId} rid={rid} onClose={() => setModal(null)} />)}
					>
						{t('Add_people')}
					</Button>
				)}
			</CallPanelHeader>

			{/* Said out loud, because the rows are Fuselage `Option`s — `li` elements in a plain box, which made
			    them neither countable nor individually referrable.

			    A list per group rather than one list around everything: the dividers between the groups are not
			    list items, and a `list` whose children are not `listitem`s is a list a screen reader may skip or
			    miscount. Each group is its own list, named by the divider that heads it, and the box around them
			    is a `group` so the panel still has one handle. */}
			<Box role='group' aria-label={t('Members')} flexGrow={1} overflowY='auto'>
				{/* First, because everyone here is waiting on somebody in this panel to let them in. */}
				{waiting.length > 0 && (
					<>
						<MembersListDivider title='Waiting_to_join' count={waiting.length} />
						<Box role='list' aria-label={t('Waiting_to_join')}>
							{waiting.map(renderEntry)}
						</Box>
					</>
				)}
				{present.length > 0 && (
					<>
						<MembersListDivider title='In_call' count={present.length} />
						<Box role='list' aria-label={t('In_call')}>
							{present.map(renderEntry)}
						</Box>
					</>
				)}
				{absent.length > 0 && (
					<>
						<MembersListDivider title='Not_in_the_call' count={absent.length} />
						<Box role='list' aria-label={t('Not_in_the_call')}>
							{absent.map(renderEntry)}
						</Box>
					</>
				)}
			</Box>
		</>
	);
};

export default CallMembersPanel;
