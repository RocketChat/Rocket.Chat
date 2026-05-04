import { Button, ButtonGroup, Modal, ModalClose, ModalContent, ModalFooter, ModalFooterControllers, ModalHeader, ModalTitle, Box, IconButton } from '@rocket.chat/fuselage';
import { useEndpoint, useToastMessageDispatch, useUserPreference, useUserSubscriptions } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const query = { open: { $ne: false } };

type ManageCategoriesModalProps = {
	onClose: () => void;
};

const ManageCategoriesModal = ({ onClose }: ManageCategoriesModalProps) => {
	const { t } = useTranslation();
	const rooms = useUserSubscriptions(query);
	const savedOrder = useUserPreference<string[]>('sidebarCustomCategoryOrder') ?? [];
	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');
	const dispatchToastMessage = useToastMessageDispatch();

	// Collect all unique custom category names from subscriptions
	const allCategories = [...new Set(rooms.map((r) => r.category?.trim()).filter((c): c is string => Boolean(c)))];

	// Build initial order: saved order first (filtering out obsolete entries), then any new unseen categories alphabetically
	const buildInitialOrder = useCallback((): string[] => {
		const known = savedOrder.filter((c) => allCategories.includes(c));
		const unseen = allCategories.filter((c) => !known.includes(c)).sort((a, b) => a.localeCompare(b));
		return [...known, ...unseen];
	}, [allCategories.join(','), savedOrder.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

	const [order, setOrder] = useState<string[]>(buildInitialOrder);

	useEffect(() => {
		setOrder(buildInitialOrder());
	}, [buildInitialOrder]);

	const move = (index: number, direction: -1 | 1) => {
		const next = index + direction;
		if (next < 0 || next >= order.length) return;
		setOrder((prev) => {
			const arr = [...prev];
			[arr[index], arr[next]] = [arr[next], arr[index]];
			return arr;
		});
	};

	const handleSave = async () => {
		try {
			await saveUserPreferences({ data: { sidebarCustomCategoryOrder: order } });
			dispatchToastMessage({ type: 'success', message: t('Category_order_saved') });
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<Modal>
			<ModalHeader>
				<ModalTitle>{t('Manage_category_order')}</ModalTitle>
				<ModalClose tabIndex={-1} title={t('Close')} onClick={onClose} />
			</ModalHeader>
			<ModalContent>
				{order.length === 0 ? (
					<Box color='hint'>{t('No_custom_categories')}</Box>
				) : (
					<Box display='flex' flexDirection='column' rowGap={8}>
						{order.map((category, index) => (
							<Box key={category} display='flex' alignItems='center' justifyContent='space-between' p={8} bg='surface-light' borderRadius={4}>
								<Box flexGrow={1} fontScale='p2m'>
									{category}
								</Box>
								<Box display='flex' flexDirection='column' rowGap={2}>
									<IconButton
										small
										icon='chevron-up'
										title={t('Move_up')}
										disabled={index === 0}
										onClick={() => move(index, -1)}
									/>
									<IconButton
										small
										icon='chevron-down'
										title={t('Move_down')}
										disabled={index === order.length - 1}
										onClick={() => move(index, 1)}
									/>
								</Box>
							</Box>
						))}
					</Box>
				)}
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button primary onClick={handleSave}>
						{t('Save')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default ManageCategoriesModal;
