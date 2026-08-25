import { Box } from '@rocket.chat/fuselage';
import { Field, FieldError, FieldGroup, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useCreateCustomCategory } from './hooks/useCreateCustomCategory';
import { useValidateCategoryName } from './validateCategoryName';
import UserAndRoomAutoCompleteMultiple from '../../components/UserAndRoomAutoCompleteMultiple';
import type { MovableRoom } from '../hooks/useCustomCategories';

type CreateCategoryModalProps = {
	room?: MovableRoom;
	onClose: () => void;
};

const CreateCategoryModal = ({ room, onClose }: CreateCategoryModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const validateName = useValidateCategoryName();
	const { createCategory, createCategoryAndMoveRoom } = useCreateCustomCategory();

	const {
		handleSubmit,
		control,
		setFocus,
		formState: { errors, isSubmitting },
	} = useForm({
		defaultValues: {
			name: '',
			rooms: room ? [room.rid] : [],
		},
	});

	useEffect(() => {
		setFocus('name');
	}, [setFocus]);

	const handleConfirm = async ({ name, rooms }: { name: string; rooms: string[] }) => {
		try {
			if (room) {
				await createCategoryAndMoveRoom(
					name,
					room,
					rooms.filter((id) => id !== room.rid),
				);
			} else {
				await createCategory(name, rooms);
				dispatchToastMessage({ type: 'success', message: t('Category_created') });
			}
			onClose();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	return (
		<GenericModal
			title={t('Create_category')}
			variant='warning'
			icon={null}
			confirmText={room ? t('Create_and_move') : t('Create')}
			confirmLoading={isSubmitting}
			onCancel={onClose}
			annotation={room ? undefined : t('You_can_add_rooms_after')}
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleConfirm)} {...props} />}
		>
			<Box marginBlockEnd={16}>
				{room ? t('Move__roomName__to', { roomName: room.name }) : t('Categories_are_private_custom_groupings_of_rooms')}
			</Box>
			<FieldGroup>
				<Field>
					<FieldLabel required>{t('Name')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='name'
							rules={{
								validate: (name: string) => validateName(name),
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

export default CreateCategoryModal;
