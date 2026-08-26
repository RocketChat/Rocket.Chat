import type { ISidebarCategory } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { Field, FieldError, FieldGroup, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useCategoryRoomIds } from './hooks/useCategoryRoomIds';
import { useUpdateCategory } from './hooks/useUpdateCategory';
import { useValidateCategoryName } from './hooks/useValidateCategoryName';
import UserAndRoomAutoCompleteMultiple from '../../components/UserAndRoomAutoCompleteMultiple';

type ManageCategoryModalProps = {
	category: ISidebarCategory;
	onClose: () => void;
};

const ManageCategoryModal = ({ category, onClose }: ManageCategoryModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const updateCategory = useUpdateCategory();
	const validateName = useValidateCategoryName();

	const initialRoomsRef = useRef(useCategoryRoomIds(category._id));

	const {
		handleSubmit,
		control,
		setFocus,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: {
			name: category.name,
			rooms: initialRoomsRef.current,
		},
	});

	useEffect(() => {
		setFocus('name');
	}, [setFocus]);

	const handleConfirm = async ({ name, rooms }: { name: string; rooms: string[] }) => {
		const trimmed = name.trim();
		const nameUnchanged = trimmed === category.name.trim();

		const initialSet = new Set(initialRoomsRef.current);
		const newSet = new Set(rooms);
		const addedRoomIds = rooms.filter((rid) => !initialSet.has(rid));
		const removedRoomIds = initialRoomsRef.current.filter((rid) => !newSet.has(rid));
		const roomsUnchanged = addedRoomIds.length === 0 && removedRoomIds.length === 0;

		if (nameUnchanged && roomsUnchanged) {
			onClose();
			return;
		}

		try {
			await updateCategory(category._id, trimmed || category.name, addedRoomIds, removedRoomIds);
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
							rules={{
								validate: (name: string) => validateName(name, category._id),
							}}
							render={({ field }) => (
								<TextInput autoComplete='off' error={errors.name?.message} aria-invalid={errors.name ? 'true' : 'false'} {...field} />
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
