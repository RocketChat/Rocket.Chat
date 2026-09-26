import { Box, Button } from '@rocket.chat/fuselage';
import { MembersListDivider } from '@rocket.chat/ui-client';
import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ConferenceContext, useConference } from '../../context/ConferenceContext';
import type { CallParticipantEntry } from '../../lib/callParticipants';
import { composeCallParticipants } from '../../lib/callParticipants';
import { hasConferenceChatAccess } from '../../lib/chatAccess';
import type { PluginParticipant } from '../../lib/providerPlugin';
import AddParticipantsModal from '../AddParticipantsModal/AddParticipantsModal';
import CallMemberItem from '../CallMemberItem/CallMemberItem';
import CallPanelHeader from '../CallPanelHeader';
import CallParticipantItem from '../CallParticipantItem/CallParticipantItem';

type CallMembersPanelProps = {
	onClose: () => void;
};

// A stable empty list, so a provider with no plugin does not recompose the groups on every render.
const NO_PARTICIPANTS: PluginParticipant[] = [];

const CallMembersPanel = ({ onClose }: CallMembersPanelProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const conference = useConference();
	const { call, room, actions, provider, viewer, media } = conference;
	const { members } = call;
	const { rid, chatAccess } = room;
	const raisedHands = useMemo(() => new Set(media?.raisedHands), [media?.raisedHands]);

	// The plugin says which participant this window joined as — the one pairing a shared display name cannot
	// settle on its own. No other row can be claimed this way.
	const claimants = useMemo(() => {
		const participantUuid = provider?.self?.participantUuid;

		if (!participantUuid || !viewer.uid) {
			return members;
		}

		return members.map((member) => (member._id === viewer.uid ? { ...member, providerParticipantId: participantUuid } : member));
	}, [members, provider?.self?.participantUuid, viewer.uid]);

	// Ours decides which group a row is in, the provider's decides what it can do: composed, not derived.
	const { waiting, present, absent } = useMemo(
		() => composeCallParticipants(claimants, provider?.participants ?? NO_PARTICIPANTS),
		[claimants, provider?.participants],
	);

	// A set rather than one pending request: ringing a second member put the first back in reach.
	const [ringingMembers, setRingingMembers] = useState<string[]>([]);

	const ringMember = (memberId: string) => {
		setRingingMembers((current) => [...current, memberId]);

		void actions
			.ringMember(memberId)
			.catch((error) => dispatchToastMessage({ type: 'error', message: error }))
			.finally(() => setRingingMembers((current) => current.filter((id) => id !== memberId)));
	};

	const renderEntry = ({ key, member, participant }: CallParticipantEntry) => {
		const controls =
			provider && participant
				? {
						participant,
						features: provider.features,
						actions: provider.actions,
						self: provider.self,
						// The provider is the only thing that can name the viewer's own row across the two lists.
						isSelf: provider.self?.participantUuid === participant.uuid,
					}
				: undefined;

		if (member) {
			return (
				<CallMemberItem
					key={key}
					member={member}
					hasChatAccess={hasConferenceChatAccess(chatAccess, member._id)}
					// Until the server's answer comes back, this is what says the ask is already on its way.
					ringing={ringingMembers.includes(member._id)}
					controls={controls}
					// What a call running in this window knows about them — absent for one at an address of its own.
					handRaised={raisedHands.has(member._id)}
					muted={media?.mutedMembers.has(member._id)}
					onMute={media?.muteMember}
					onRing={ringMember}
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
						// The modal region is mounted outside the conference's provider, so the context is carried
						// across by hand or the modal loses the user picker and the ring option.
						onClick={() =>
							setModal(
								<ConferenceContext.Provider value={conference}>
									<AddParticipantsModal onClose={() => setModal(null)} />
								</ConferenceContext.Provider>,
							)
						}
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
