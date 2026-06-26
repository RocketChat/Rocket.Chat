import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation, useSetting, useAtLeastOnePermission, useSetModal } from '@rocket.chat/ui-contexts';

import { useCreateRoomModal } from './useCreateRoomModal';
import CreateDiscussion from '../../../components/CreateDiscussion';
import CreateCategoryModal from '../../../sidebar/categories/CreateCategoryModal';
import { useOutboundMessageAccess } from '../../../views/omnichannel/components/outboundMessage/hooks';
import { useOutboundMessageModal } from '../../../views/omnichannel/components/outboundMessage/modals';
import CreateChannelModal from '../actions/CreateChannelModal';
import CreateDirectMessage from '../actions/CreateDirectMessage';
import CreateTeamModal from '../actions/CreateTeamModal';

const CREATE_CHANNEL_PERMISSIONS = ['create-c', 'create-p'];
const CREATE_TEAM_PERMISSIONS = ['create-team'];
const CREATE_DIRECT_PERMISSIONS = ['create-d'];
const CREATE_DISCUSSION_PERMISSIONS = ['start-discussion', 'start-discussion-other-user'];

export const useCreateNewItems = (): GenericMenuItemProps[] => {
	const t = useTranslation();
	const discussionEnabled = useSetting('Discussion_enabled');

	const canCreateChannel = useAtLeastOnePermission(CREATE_CHANNEL_PERMISSIONS);
	const canCreateTeam = useAtLeastOnePermission(CREATE_TEAM_PERMISSIONS);
	const canCreateDirectMessages = useAtLeastOnePermission(CREATE_DIRECT_PERMISSIONS);
	const canCreateDiscussion = useAtLeastOnePermission(CREATE_DISCUSSION_PERMISSIONS);
	const canSendOutboundMessage = useOutboundMessageAccess();

	const createChannel = useCreateRoomModal(CreateChannelModal);
	const createTeam = useCreateRoomModal(CreateTeamModal);
	const createDiscussion = useCreateRoomModal(CreateDiscussion);
	const createDirectMessage = useCreateRoomModal(CreateDirectMessage);
	const outboundMessageModal = useOutboundMessageModal();
	const setModal = useSetModal();

	const createChannelItem: GenericMenuItemProps = {
		id: 'channel',
		content: t('Channel'),
		icon: 'hashtag',
		onClick: () => {
			createChannel();
		},
	};
	const createTeamItem: GenericMenuItemProps = {
		id: 'team',
		content: t('Team'),
		icon: 'team',
		onClick: () => {
			createTeam();
		},
	};
	const createDirectMessageItem: GenericMenuItemProps = {
		id: 'direct',
		content: t('Direct_message'),
		icon: 'balloon',
		onClick: () => {
			createDirectMessage();
		},
	};
	const createDiscussionItem: GenericMenuItemProps = {
		id: 'discussion',
		content: t('Discussion'),
		icon: 'discussion',
		onClick: () => {
			createDiscussion();
		},
	};
	const createOutboundMessageItem: GenericMenuItemProps = {
		id: 'outbound-message',
		content: t('Outbound_message'),
		icon: 'send',
		onClick: () => outboundMessageModal.open(),
	};
	const createCategoryItem: GenericMenuItemProps = {
		id: 'category',
		content: t('Category'),
		icon: 'folder',
		onClick: () => {
			const closeModal = (): void => setModal(null);
			setModal(<CreateCategoryModal onClose={closeModal} />);
		},
	};

	return [
		...(canCreateDirectMessages ? [createDirectMessageItem] : []),
		...(canCreateDiscussion && discussionEnabled ? [createDiscussionItem] : []),
		...(canCreateChannel ? [createChannelItem] : []),
		...(canCreateTeam && canCreateChannel ? [createTeamItem] : []),
		...(canSendOutboundMessage ? [createOutboundMessageItem] : []),
		createCategoryItem,
	];
};
