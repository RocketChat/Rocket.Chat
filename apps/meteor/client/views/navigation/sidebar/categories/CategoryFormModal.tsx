import { Box, Field, FieldError, FieldGroup, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import type { MovableRoom } from '../../hooks/useCustomCategories';
import { MAX_CATEGORY_NAME_LENGTH, useCustomCategories } from '../../hooks/useCustomCategories';

type CategoryFormModalProps = {
	/** When provided, the modal works as "Create and move" (flow D): it creates the category and moves this room into it. */
	room?: MovableRoom;
	onClose: () => void;
};

const CategoryFormModal = ({ room, onClose }: CategoryFormModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { createCategory, createCategoryAndMoveRoom, validateName } = useCustomCategories();
	const nameField = useId();

	const {
		handleSubmit,
		control,
		setError,
		setFocus,
		formState: { errors },
	} = useForm({ defaultValues: { name: '' } });

	useEffect(() => {
		setFocus('name');
	}, [setFocus]);

	const handleConfirm = async ({ name }: { name: string }) => {
		const error = validateName(name);
		if (error) {
			setError(
				'name',
				{ message: error === 'empty' ? t('Please_enter_a_category_name') : t('A_category_with_this_name_already_exists') },
				{ shouldFocus: true },
			);
			return;
		}

		try {
			if (room) {
				await createCategoryAndMoveRoom(name, room);
			} else {
				await createCategory(name);
				dispatchToastMessage({ type: 'success', message: t('Category_created') });
			}
			onClose();
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	};

	const submit = handleSubmit(handleConfirm);

	return (
		<GenericModal
			title={t('Create_category')}
			icon={null}
			confirmText={room ? t('Create_and_move') : t('Create')}
			onCancel={onClose}
			annotation={room ? undefined : t('You_can_add_rooms_after')}
			wrapperFunction={(props) => <Box is='form' onSubmit={(e) => void submit(e)} {...props} />}
		>
			<Box mbe={16} color='hint'>
				{room ? t('Move__roomName__to', { roomName: room.name }) : t('Categories_are_private_custom_groupings_of_rooms')}
			</Box>
			<FieldGroup>
				<Field>
					<FieldLabel required htmlFor={nameField}>
						{t('Name')}
					</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='name'
							render={({ field }) => (
								<TextInput
									id={nameField}
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
			</FieldGroup>
		</GenericModal>
	);
};

export default CategoryFormModal;
