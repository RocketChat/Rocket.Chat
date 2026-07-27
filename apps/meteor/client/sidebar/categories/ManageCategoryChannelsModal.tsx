import { Box } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldLabel } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CategoryChannelPicker from './CategoryChannelPicker';
import { useCategoryChannels } from './useCategoryChannels';
import { useSidebarCategories } from './useSidebarCategories';

type ManageCategoryChannelsModalProps = {
	categoryId: string;
	categoryName: string;
	onClose: () => void;
};

const ManageCategoryChannelsModal = ({ categoryId, categoryName, onClose }: ManageCategoryChannelsModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { categories, setCategoryChannels, categoryByRoom } = useSidebarCategories();
	const channels = useCategoryChannels(categoryByRoom, categoryId);

	const currentRooms = useMemo(() => categories.find((category) => category._id === categoryId)?.rooms ?? [], [categories, categoryId]);

	// Channels currently in the category that aren't offered as options (e.g. archived or
	// non-channel rooms) must be preserved across a save instead of being silently dropped.
	const hiddenRooms = useMemo(() => {
		const optionRids = new Set(channels.map((channel) => channel.rid));
		return currentRooms.filter((rid) => !optionRids.has(rid));
	}, [channels, currentRooms]);

	const [selected, setSelected] = useState<string[]>(() => currentRooms);

	const toggleChannel = useCallback(
		(rid: string) => setSelected((current) => (current.includes(rid) ? current.filter((id) => id !== rid) : [...current, rid])),
		[],
	);

	const selectedCount = selected.filter((rid) => !hiddenRooms.includes(rid)).length;

	const handleSave = useCallback(() => {
		const visibleSelected = selected.filter((rid) => !hiddenRooms.includes(rid));
		setCategoryChannels(categoryId, [...hiddenRooms, ...visibleSelected]);
		dispatchToastMessage({ type: 'success', message: t('Category_has_been_updated', { name: categoryName }) });
		onClose();
	}, [selected, hiddenRooms, setCategoryChannels, categoryId, dispatchToastMessage, t, categoryName, onClose]);

	return (
		<GenericModal
			title={t('Manage_channels')}
			confirmText={t('Save')}
			icon={null}
			onConfirm={handleSave}
			onCancel={onClose}
			onClose={onClose}
		>
			<FieldGroup>
				<Field>
					<Box display='flex' alignItems='baseline' justifyContent='space-between' mbe={8}>
						<FieldLabel>{t('Channels')}</FieldLabel>
						<Box fontScale='c1' color='hint'>
							{selectedCount > 0 ? t('N_selected', { count: selectedCount }) : t('Select_channels_to_add')}
						</Box>
					</Box>
					<CategoryChannelPicker channels={channels} selected={selected} onToggle={toggleChannel} />
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ManageCategoryChannelsModal;
