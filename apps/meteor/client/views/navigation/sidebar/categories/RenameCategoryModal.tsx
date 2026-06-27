import type { ISidebarCustomCategory } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldGroup, FieldLabel, FieldRow, TextInput, Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { MAX_CATEGORY_NAME_LENGTH, useCustomCategories } from '../../hooks/useCustomCategories';

type RenameCategoryModalProps = {
	category: ISidebarCustomCategory;
	onClose: () => void;
};

const RenameCategoryModal = ({ category, onClose }: RenameCategoryModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const { renameCategory, validateName } = useCustomCategories();
	const nameField = useId();

	const {
		handleSubmit,
		control,
		setError,
		setFocus,
		formState: { errors },
	} = useForm({ defaultValues: { name: category.name } });

	useEffect(() => {
		setFocus('name');
	}, [setFocus]);

	const handleConfirm = async ({ name }: { name: string }) => {
		const trimmed = name.trim();
		// An unchanged name is a no-op that just closes the modal.
		if (trimmed === category.name.trim()) {
			onClose();
			return;
		}

		const error = validateName(name, category._id);
		if (error) {
			setError(
				'name',
				{ message: error === 'empty' ? t('Please_enter_a_category_name') : t('A_category_with_this_name_already_exists') },
				{ shouldFocus: true },
			);
			return;
		}

		try {
			await renameCategory(category._id, name);
			dispatchToastMessage({ type: 'success', message: t('Category_renamed_to__name__', { name: trimmed }) });
			onClose();
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}
	};

	const submit = handleSubmit(handleConfirm);

	return (
		<GenericModal
			title={t('Rename_category')}
			icon={null}
			confirmText={t('Save')}
			onCancel={onClose}
			wrapperFunction={(props) => <Box is='form' onSubmit={(e) => void submit(e)} {...props} />}
		>
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

export default RenameCategoryModal;
