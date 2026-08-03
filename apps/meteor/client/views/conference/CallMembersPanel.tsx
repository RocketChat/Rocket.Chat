import { Box, Button, IconButton } from '@rocket.chat/fuselage';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import AddParticipantsModal from './AddParticipantsModal';
import CallMemberItem from './CallMemberItem';
import type { ConferenceMember } from './hooks/useCallOutcome';

type CallMembersPanelProps = {
	callId: string;
	rid?: string;
	members: ConferenceMember[];
	/** Ids of members who can't read the chat — membership grants no room access. */
	membersWithoutChatAccess: string[];
	onClose?: () => void;
};

/**
 * Who is on the call and where each of them stands.
 *
 * This is where the membership model finally becomes visible: until now a decline was recorded and a member
 * added from outside the room was flagged in aggregate, but there was nowhere to see either against a name.
 * It also carries "add people", which belongs with the list of who is already here rather than with the chat.
 */
const CallMembersPanel = ({ callId, rid, members, membersWithoutChatAccess, onClose }: CallMembersPanelProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const ring = useEndpoint('POST', '/v1/video-conference.ring');

	const withoutAccess = new Set(membersWithoutChatAccess);

	// The conference stream tells every participant when membership moves, so the list refreshes itself and
	// there is nothing to refetch here on success.
	const { mutate: ringMember, variables: ringingId } = useMutation({
		mutationFn: (memberId: string) => ring({ callId, users: [memberId] }),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	return (
		<>
			<Box
				is='header'
				display='flex'
				alignItems='center'
				justifyContent='space-between'
				paddingInline={12}
				paddingBlock={8}
				borderBlockEndWidth={1}
				borderBlockEndColor='stroke-extra-light'
			>
				<Box is='h5' fontScale='h5' color='default'>
					{t('Members')} ({members.length})
				</Box>
				<Box display='flex' alignItems='center'>
					{rid && (
						<Button
							small
							icon='user-plus'
							onClick={() => setModal(<AddParticipantsModal callId={callId} rid={rid} onClose={() => setModal(null)} />)}
						>
							{t('Add_people')}
						</Button>
					)}
					{onClose && <IconButton marginInlineStart={8} small icon='cross' title={t('Close')} onClick={onClose} />}
				</Box>
			</Box>

			<Box flexGrow={1} overflowY='auto' paddingBlock={4}>
				{members.map((member) => (
					<CallMemberItem
						key={member._id}
						member={member}
						hasChatAccess={!withoutAccess.has(member._id)}
						ringing={ringingId === member._id}
						onRing={ringMember}
					/>
				))}
			</Box>
		</>
	);
};

export default CallMembersPanel;
