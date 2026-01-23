import { Box, Button, Chip } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { GenericMenu, GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import FilterByText from '../../../../../components/FilterByText';
import { useChatsContext } from '../../contexts/ChatsContext';
import { useOmnichannelDirectoryRouter } from '../../hooks/useOmnichannelDirectoryRouter';

const ChatsTableFilter = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const omnichannelDirectoryRouter = useOmnichannelDirectoryRouter();
	const queryClient = useQueryClient();
	const removeClosedRooms = useEndpoint('POST', '/v1/livechat/rooms.removeAllClosedRooms');

	const { filtersQuery, displayFilters, setFiltersQuery, removeFilter, textInputRef } = useChatsContext();

	const handleRemoveAllClosed = useEffectEvent(async () => {
		const onDeleteAll = async () => {
			try {
				await removeClosedRooms();
				queryClient.invalidateQueries({ queryKey: ['current-chats'] });
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
			<FilterByText
				ref={textInputRef}
				value={filtersQuery.guest}
				onChange={(event) => setFiltersQuery((prevState) => ({ ...prevState, guest: event.target.value }))}
			>
				<Button
					onClick={() =>
						omnichannelDirectoryRouter.navigate({
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

export default ChatsTableFilter;
