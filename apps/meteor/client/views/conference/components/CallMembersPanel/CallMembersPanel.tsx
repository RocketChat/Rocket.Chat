import { isInVideoConference } from '@rocket.chat/core-typings';
import { Box, Button } from '@rocket.chat/fuselage';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { hasConferenceChatAccess } from '../../../../../lib/videoConference/chatAccess';
import { MembersListDivider } from '../../../room/contextualBar/RoomMembers/MembersListDivider';
import type { ConferenceChatAccess, ConferenceMember } from '../../hooks/useConferenceEmbedded';
import AddParticipantsModal from '../AddParticipantsModal/AddParticipantsModal';
import CallMemberItem from '../CallMemberItem/CallMemberItem';
import CallPanelHeader from '../CallPanelHeader';

type CallMembersPanelProps = {
	callId: string;
	rid?: string;
	members: ConferenceMember[];
	chatAccess?: ConferenceChatAccess;
	onClose: () => void;
};

const CallMembersPanel = ({ callId, rid, members, chatAccess, onClose }: CallMembersPanelProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const ring = useEndpoint('POST', '/v1/video-conference.ring');

	const [present, absent] = useMemo(
		() => [members.filter(isInVideoConference), members.filter((member) => !isInVideoConference(member))],
		[members],
	);

	// Who has been rung and not yet answered for — a set rather than the mutation's own `variables`, which holds
	// only the most recent call: ringing a second member while the first request was still out put that one back
	// in reach, which is the double ring this was added to prevent.
	const [ringingMembers, setRingingMembers] = useState<string[]>([]);

	const { mutate: ringMember } = useMutation({
		mutationFn: (memberId: string) => ring({ callId, userId: memberId }),
		onMutate: (memberId) => setRingingMembers((current) => [...current, memberId]),
		onSettled: (_data, _error, memberId) => setRingingMembers((current) => current.filter((id) => id !== memberId)),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const renderMember = (member: ConferenceMember) => (
		<CallMemberItem
			key={member._id}
			member={member}
			hasChatAccess={hasConferenceChatAccess(chatAccess, member._id)}
			// The row stops offering to ring once the member is ringing, but that is the server's answer coming
			// back — until it does, this is what says the ask is already on its way.
			ringing={ringingMembers.includes(member._id)}
			onRing={ringMember}
		/>
	);

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
				{present.length > 0 && (
					<>
						<MembersListDivider title='In_call' count={present.length} />
						<Box role='list' aria-label={t('In_call')}>
							{present.map(renderMember)}
						</Box>
					</>
				)}
				{absent.length > 0 && (
					<>
						<MembersListDivider title='Not_in_the_call' count={absent.length} />
						<Box role='list' aria-label={t('Not_in_the_call')}>
							{absent.map(renderMember)}
						</Box>
					</>
				)}
			</Box>
		</>
	);
};

export default CallMembersPanel;
