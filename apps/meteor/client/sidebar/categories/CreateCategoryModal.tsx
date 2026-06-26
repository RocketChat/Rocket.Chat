import { Box } from '@rocket.chat/fuselage';
import { Field, FieldGroup, FieldHint, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CategoryChannelPicker from './CategoryChannelPicker';
import { useCategoryChannels } from './useCategoryChannels';
import { useSidebarCategories } from './useSidebarCategories';

type CreateCategoryModalProps = {
	onClose: () => void;
};

const CreateCategoryModal = ({ onClose }: CreateCategoryModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { createCategory, categoryByRoom } = useSidebarCategories();
	const channels = useCategoryChannels(categoryByRoom);

	const [name, setName] = useState('');
	const [selected, setSelected] = useState<string[]>([]);
	const nameId = useId();

	const toggleChannel = useCallback(
		(rid: string) => setSelected((current) => (current.includes(rid) ? current.filter((id) => id !== rid) : [...current, rid])),
		[],
	);

	const handleCreate = useCallback(() => {
		const trimmed = name.trim();
		if (!trimmed) {
			return;
		}
		createCategory(trimmed, selected);
		dispatchToastMessage({ type: 'success', message: t('Category_has_been_created', { name: trimmed }) });
		onClose();
	}, [name, selected, createCategory, dispatchToastMessage, t, onClose]);

	return (
		<GenericModal
			title={t('Create_category')}
			confirmText={t('Create')}
			confirmDisabled={!name.trim()}
			icon={null}
			onConfirm={handleCreate}
			onCancel={onClose}
			onClose={onClose}
		>
			<FieldGroup>
				<Field>
					<FieldLabel htmlFor={nameId}>{t('Name')}</FieldLabel>
					<FieldRow>
						<TextInput
							id={nameId}
							value={name}
							onChange={(e): void => setName((e.target as HTMLInputElement).value)}
							placeholder={t('Category_name_placeholder')}
							autoFocus
						/>
					</FieldRow>
					<FieldHint>{t('Category_privacy_hint')}</FieldHint>
				</Field>
				<Field>
					<Box display='flex' alignItems='baseline' justifyContent='space-between' mbe={8}>
						<FieldLabel>{t('Add_channels')}</FieldLabel>
						<Box fontScale='c1' color='hint'>
							{selected.length > 0 ? t('N_selected', { count: selected.length }) : t('Optional')}
						</Box>
					</Box>
					<CategoryChannelPicker channels={channels} selected={selected} onToggle={toggleChannel} />
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default CreateCategoryModal;
