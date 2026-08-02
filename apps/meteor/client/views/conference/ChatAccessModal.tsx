import type { VideoConferenceChatAccessMode } from '@rocket.chat/core-typings';
import {
	Box,
	Button,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalHeaderText,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useId } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import ChatAccessMember from './ChatAccessMember';
import type { ConferenceChatAccess } from './hooks/useConferenceEmbedded';

type ChatAccessModalProps = {
	callId: string;
	access: ConferenceChatAccess;
	onClose: () => void;
};

/**
 * Both ways out of "some members can't see the chat" give something away — the room's history, or the
 * conversation's place in it — so neither can be applied on the user's behalf. The consequences are spelled
 * out next to each action and the modal is dismissable, which is the whole point of asking here.
 *
 * Which one leads is a privacy call: opening a private room's history to an outsider is the bigger step, so
 * private rooms and DMs lead with the discussion, and public rooms — whose history is already open — lead
 * with the invite. A DM can't take new members at all, so there it is the only option.
 */
const ChatAccessModal = ({ callId, access, onClose }: ChatAccessModalProps) => {
	const { t } = useTranslation();
	const titleId = useId();
	const dispatchToastMessage = useToastMessageDispatch();
	const shareChat = useEndpoint('POST', '/v1/video-conference.share-chat');

	// The conference's own `discussionUpdated` broadcast is what moves everyone's chat panel, so there is
	// nothing to refetch here on success.
	const { mutate, isPending, variables } = useMutation({
		mutationFn: (mode: VideoConferenceChatAccessMode) => shareChat({ callId, mode }),
		onSuccess: () => onClose(),
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const roomName = access.name;
	const discussionLeads = !access.canInvite || access.type === 'p' || access.type === 'd';

	const inviteButton = access.canInvite && (
		<Button primary={!discussionLeads} loading={isPending && variables === 'invite'} onClick={() => mutate('invite')}>
			{t('Add_to_room')}
		</Button>
	);

	const discussionButton = (
		<Button primary={discussionLeads} loading={isPending && variables === 'discussion'} onClick={() => mutate('discussion')}>
			{t('Create_discussion')}
		</Button>
	);

	return (
		<Modal aria-labelledby={titleId}>
			<ModalHeader>
				<ModalHeaderText>
					<ModalTitle id={titleId}>{t('Chat_access')}</ModalTitle>
				</ModalHeaderText>
				<ModalClose tabIndex={-1} aria-label={t('Close')} onClick={onClose} />
			</ModalHeader>
			<ModalContent fontScale='p2'>
				<Box color='default'>{t('These_participants_cannot_see_the_chat')}</Box>
				{access.members.map((member) => (
					<ChatAccessMember key={member._id} member={member} />
				))}

				{access.canInvite && (
					<Box marginBlockStart={16}>
						<Box fontScale='p2m' color='default'>
							{t('Add_to_room')}
						</Box>
						<Box fontScale='p2' color='hint'>
							<Trans
								i18nKey='Chat_access_add_to_room_description'
								values={{ roomName }}
								components={{ b: <Box is='span' fontWeight={600} color='default' /> }}
							/>
						</Box>
					</Box>
				)}

				<Box marginBlockStart={16}>
					<Box fontScale='p2m' color='default'>
						{t('Create_discussion')}
					</Box>
					<Box fontScale='p2' color='hint'>
						<Trans
							i18nKey='Chat_access_create_discussion_description'
							values={{ roomName }}
							components={{ b: <Box is='span' fontWeight={600} color='default' /> }}
						/>
					</Box>
				</Box>
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button secondary onClick={onClose}>
						{t('Cancel')}
					</Button>
					{/* The leading action sits last, where the primary action is expected. */}
					{discussionLeads ? inviteButton : discussionButton}
					{discussionLeads ? discussionButton : inviteButton}
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default ChatAccessModal;
