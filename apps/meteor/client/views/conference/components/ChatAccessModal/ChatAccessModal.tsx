import type { VideoConferenceChatAccessMode } from '@rocket.chat/core-typings';
import { getUserDisplayName } from '@rocket.chat/core-typings';
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
	Option,
	OptionAvatar,
	OptionContent,
} from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint, useSetting, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { chatAccessLeadsWithDiscussion } from '../../../../../lib/videoConference/chatAccess';
import { videoConferenceQueryKeys } from '../../../../lib/queryKeys';
import type { ConferenceChatAccess } from '../../hooks/useConferenceEmbedded';

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
 * Which one leads is a privacy call, shared with the server so the two can't drift — see
 * `chatAccessLeadsWithDiscussion`. A DM can't take new members at all, so there the discussion is the only
 * option offered.
 */
const ChatAccessModal = ({ callId, access, onClose }: ChatAccessModalProps) => {
	const { t } = useTranslation();
	const titleId = useId();
	const dispatchToastMessage = useToastMessageDispatch();
	// Read once for the whole list rather than per member: naming someone is a setting and a pure function, not
	// a reason for each row to be a component of its own.
	const useRealName = useSetting('UI_Use_Real_Name', false);
	const shareChat = useEndpoint('POST', '/v1/video-conference.share-chat');
	const queryClient = useQueryClient();

	// The server broadcasts the change to every participant, but don't make the one who asked for it wait for
	// the round trip to see their own notice go away.
	const { mutate, isPending, variables } = useMutation({
		mutationFn: (mode: VideoConferenceChatAccessMode) => shareChat({ callId, mode }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: videoConferenceQueryKeys.conference(callId) });
			onClose();
		},
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

	const roomName = access.name;
	const discussionLeads = chatAccessLeadsWithDiscussion(access);

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
				{/* Named from the conference's own record — there may be no shared room to look them up in. */}
				{access.members.map((member) => (
					<Option key={member._id}>
						<OptionAvatar>
							<UserAvatar username={member.username} size='x24' />
						</OptionAvatar>
						<OptionContent>{getUserDisplayName(member.name, member.username, useRealName)}</OptionContent>
					</Option>
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
