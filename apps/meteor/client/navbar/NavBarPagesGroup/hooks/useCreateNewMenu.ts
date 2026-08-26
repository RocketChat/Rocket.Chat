import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useCreateNewItems } from './useCreateNewItems';
import { useCategoryModals } from '../../../sidebar/categories/hooks/useCategoryModals';
import { useOutboundMessageAccess } from '../../../views/omnichannel/components/outboundMessage/hooks';
import { useOutboundMessageModal } from '../../../views/omnichannel/components/outboundMessage/modals';

const CREATE_ROOM_PERMISSIONS = ['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user'];

export const useCreateNewMenu = () => {
	const { t } = useTranslation();
	const showCreate = useAtLeastOnePermission(CREATE_ROOM_PERMISSIONS);
	const { openCreate } = useCategoryModals();

	const canSendOutboundMessage = useOutboundMessageAccess();
	const outboundMessageModal = useOutboundMessageModal();

	const createRoomItems = useCreateNewItems();
	const outboundMessageItem: GenericMenuItemProps = {
		id: 'outbound-message',
		content: t('Outbound_message'),
		icon: 'send',
		onClick: () => outboundMessageModal.open(),
	};

	const sections = [
		{
			title: t('Create_new'),
			items: [...createRoomItems, ...(canSendOutboundMessage ? [outboundMessageItem] : [])],
			permission: showCreate || canSendOutboundMessage,
		},
		{
			items: [{ id: 'category', icon: 'folder', content: t('Category'), onClick: () => openCreate() }] as GenericMenuItemProps[],
			permission: true,
		},
	];

	return sections.filter((section) => section.permission);
};
