import { isInVideoConference } from '@rocket.chat/core-typings';
import { Box, Button } from '@rocket.chat/fuselage';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
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

	const { mutate: ringMember } = useMutation({
		mutationFn: (memberId: string) => ring({ callId, userId: memberId }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const renderMember = (member: ConferenceMember) => (
		<CallMemberItem key={member._id} member={member} hasChatAccess={hasConferenceChatAccess(chatAccess, member._id)} onRing={ringMember} />
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
