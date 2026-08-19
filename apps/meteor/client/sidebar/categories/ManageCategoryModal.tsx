import type { ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { Field, FieldError, FieldGroup, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import UserAndRoomAutoCompleteMultiple from '../../components/UserAndRoomAutoCompleteMultiple';
import { MAX_CATEGORY_NAME_LENGTH, useCustomCategories } from '../hooks/useCustomCategories';

type ManageCategoryModalProps = {
	category: ISidebarCustomCategory;
	onClose: () => void;
};

const ManageCategoryModal = ({ category, onClose }: ManageCategoryModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { updateCategory, validateName } = useCustomCategories();

	const {
		handleSubmit,
		control,
		setError,
		setFocus,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: {
			name: category.name,
			rooms: category.rooms ?? [],
		},
	});

	useEffect(() => {
		setFocus('name');
	}, [setFocus]);

	const handleConfirm = async ({ name, rooms }: { name: string; rooms: string[] }) => {
		const trimmed = name.trim();
		const nameUnchanged = trimmed === category.name.trim();
		const roomsUnchanged = JSON.stringify([...(category.rooms ?? [])].sort()) === JSON.stringify([...rooms].sort());

		if (nameUnchanged && roomsUnchanged) {
			onClose();
			return;
		}

		if (!nameUnchanged) {
			const error = validateName(name, category._id);
			if (error) {
				setError(
					'name',
					{ message: error === 'empty' ? t('Please_enter_a_category_name') : t('A_category_with_this_name_already_exists') },
					{ shouldFocus: true },
				);
				return;
			}
		}

		try {
			await updateCategory(category._id, trimmed || category.name, rooms);
			dispatchToastMessage({ type: 'success', message: t('Category_saved') });
			onClose();
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	};

	return (
		<GenericModal
			title={t('Manage_category')}
			variant='warning'
			icon={null}
			confirmText={t('Save')}
			confirmLoading={isSubmitting}
			confirmDisabled={isSubmitting}
			onCancel={onClose}
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleConfirm)} {...props} />}
		>
			<FieldGroup>
				<Field>
					<FieldLabel required>{t('Name')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='name'
							render={({ field }) => (
								<TextInput
									autoComplete='off'
									maxLength={MAX_CATEGORY_NAME_LENGTH}
									error={errors.name?.message}
									aria-invalid={errors.name ? 'true' : 'false'}
									{...field}
								/>
							)}
						/>
					</FieldRow>
					{errors.name && <FieldError>{errors.name.message}</FieldError>}
				</Field>
				<Field>
					<FieldLabel>{t('Rooms')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='rooms'
							render={({ field: { value, onChange } }) => (
								<UserAndRoomAutoCompleteMultiple value={value} onChange={onChange} excludeTypes={['l']} allowReadOnly />
							)}
						/>
					</FieldRow>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default ManageCategoryModal;
