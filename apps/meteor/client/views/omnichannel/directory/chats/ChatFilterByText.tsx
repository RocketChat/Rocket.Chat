import { Box, Button, Chip } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useMethod, useRoute, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import FilterByText from '../../../../components/FilterByText';
import GenericMenu from '../../../../components/GenericMenu/GenericMenu';
import GenericModal from '../../../../components/GenericModal';
import { useChatsFilters } from './useChatsFilters';

const ChatFilterByText = () => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const directoryRoute = useRoute('omnichannel-directory');
	const removeClosedChats = useMethod('livechat:removeAllClosedRooms');

	const { displayFilters, setFiltersQuery, removeFilter } = useChatsFilters();

	const handleRemoveAllClosed = useEffectEvent(async () => {
		const onDeleteAll = async () => {
			try {
				await removeClosedChats();
				reload?.();
				dispatchToastMessage({ type: 'success', message: t('Chat_removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(
			<GenericModal
				variant='danger'
				data-qa-id='current-chats-modal-remove-all-closed'
				onConfirm={onDeleteAll}
				onCancel={() => setModal(null)}
				confirmText={t('Delete')}
			/>,
		);
	});

	const menuItems = [
		{
			items: [
				{
					id: 'delete-all-closed-chats',
					variant: 'danger',
					icon: 'trash',
					content: t('Delete_all_closed_chats'),
					onClick: handleRemoveAllClosed,
				} as const,
			],
		},
	];

	return (
		<>
			<FilterByText onChange={(text) => setFiltersQuery((prevState) => ({ ...prevState, guest: text }))}>
				<Button
					onClick={() =>
						directoryRoute.push({
							tab: 'chats',
							context: 'filters',
						})
					}
					icon='customize'
				>
					{t('Filters')}
				</Button>
				<GenericMenu placement='bottom-end' detached title={t('More')} sections={menuItems} />
			</FilterByText>
			<Box display='flex' flexWrap='wrap' mbe={4}>
				{Object.entries(displayFilters).map(([value, label], index) => {
					if (!label) {
						return null;
					}

					return (
						<Chip mie={8} mbe={8} key={index} onClick={() => removeFilter(value)}>
							{label}
						</Chip>
					);
				})}
			</Box>
		</>
	);
};

export default ChatFilterByText;
