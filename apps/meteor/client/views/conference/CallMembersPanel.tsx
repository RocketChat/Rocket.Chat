import { isInVideoConference } from '@rocket.chat/core-typings';
import { Box, Button } from '@rocket.chat/fuselage';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import AddParticipantsModal from './AddParticipantsModal';
import CallMemberItem from './CallMemberItem';
import CallPanelHeader from './CallPanelHeader';
import type { ConferenceMember } from './hooks/useCallOutcome';
import type { ConferenceChatAccess } from './hooks/useConferenceEmbedded';
import { hasConferenceChatAccess } from '../../../lib/videoConference/chatAccess';
import { MembersListDivider } from '../room/contextualBar/RoomMembers/MembersListDivider';

type CallMembersPanelProps = {
	callId: string;
	rid?: string;
	members: ConferenceMember[];
	/** Where the chat lives and who among the members can't read it — membership grants no room access. */
	chatAccess?: ConferenceChatAccess;
	onClose: () => void;
};

/**
 * Who is on the call and where each of them stands, shaped like the room's own members list so the two read the
 * same way.
 *
 * This is where the membership model finally becomes visible: until now a decline was recorded and a member
 * added from outside the room was flagged in aggregate, but there was nowhere to see either against a name. It
 * also carries "add people", which belongs with the list of who is already here rather than with the chat.
 *
 * Split in two, because the two halves answer different questions: who is here, and who still isn't.
 */
const CallMembersPanel = ({ callId, rid, members, chatAccess, onClose }: CallMembersPanelProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const ring = useEndpoint('POST', '/v1/video-conference.ring');

	const [present, absent] = useMemo(
		() => [members.filter(isInVideoConference), members.filter((member) => !isInVideoConference(member))],
		[members],
	);

	// The conference stream tells every participant when membership moves, so the list refreshes itself and
	// there is nothing to refetch here on success.
	const { mutate: ringMember } = useMutation({
		mutationFn: (memberId: string) => ring({ callId, users: [memberId] }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const renderMember = (member: ConferenceMember) => (
		<CallMemberItem key={member._id} member={member} hasChatAccess={hasConferenceChatAccess(chatAccess, member._id)} onRing={ringMember} />
	);

	return (
		<>
			<CallPanelHeader title={t('Members')} onClose={onClose}>
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

			<Box flexGrow={1} overflowY='auto'>
				{present.length > 0 && (
					<>
						<MembersListDivider title='In_call' count={present.length} />
						{present.map(renderMember)}
					</>
				)}
				{absent.length > 0 && (
					<>
						<MembersListDivider title='Not_in_the_call' count={absent.length} />
						{absent.map(renderMember)}
					</>
				)}
			</Box>
		</>
	);
};

export default CallMembersPanel;
