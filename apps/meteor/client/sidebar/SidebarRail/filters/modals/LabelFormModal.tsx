import type { ISubscriptionLabel, SubscriptionLabelColor, SubscriptionLabelIcon } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { Field, FieldError, FieldGroup, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage-forms';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect, useId } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import LabelColorPicker from './LabelColorPicker';
import LabelIconPicker from './LabelIconPicker';
import { useFormSubmitWithDirtyCheck } from '../../../../hooks/useFormSubmitWithDirtyCheck';
import { useCreateLabel, useUpdateLabel } from '../hooks/useLabelMutations';
import { useValidateLabelName } from '../hooks/useValidateLabelName';

type LabelFormData = {
	name: string;
	icon: SubscriptionLabelIcon;
	color: SubscriptionLabelColor;
};

type LabelFormModalProps = {
	label?: ISubscriptionLabel;
	onClose: () => void;
};

const LabelFormModal = ({ label, onClose }: LabelFormModalProps) => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const validateName = useValidateLabelName();
	const createLabel = useCreateLabel();
	const updateLabel = useUpdateLabel();
	const iconLabelId = useId();
	const colorLabelId = useId();

	const {
		handleSubmit,
		control,
		setFocus,
		watch,
		formState: { errors, isDirty, isSubmitting },
	} = useForm<LabelFormData>({
		mode: 'onSubmit',
		defaultValues: {
			name: label?.name ?? '',
			icon: label?.icon ?? 'tag',
			color: label?.color ?? 'default',
		},
	});

	useEffect(() => {
		setFocus('name');
	}, [setFocus]);

	const color = watch('color');

	const handleSave = useFormSubmitWithDirtyCheck(
		async ({ name, icon, color }: LabelFormData) => {
			if (label) {
				await updateLabel.mutateAsync({ labelId: label._id, name: name.trim(), icon, color });
			} else {
				await createLabel.mutateAsync({ name: name.trim(), icon, color });
			}

			dispatchToastMessage({ type: 'success', message: t('Saved') });
			onClose();
		},
		{ isDirty: !label || isDirty },
	);

	return (
		<GenericModal
			title={label ? t('Edit_label') : t('New_label')}
			variant='warning'
			icon={null}
			confirmText={t('Save')}
			confirmLoading={isSubmitting}
			onCancel={onClose}
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handleSave)} {...props} />}
		>
			<FieldGroup>
				<Field>
					<FieldLabel required>{t('Name')}</FieldLabel>
					<FieldRow>
						<Controller
							control={control}
							name='name'
							rules={{ validate: (name) => validateName(name, label?._id) }}
							render={({ field }) => (
								<TextInput autoComplete='off' error={errors.name?.message} aria-invalid={errors.name ? 'true' : 'false'} {...field} />
							)}
						/>
					</FieldRow>
					{errors.name && <FieldError>{errors.name.message}</FieldError>}
				</Field>
				<Field>
					<Box id={colorLabelId} fontScale='p2m' color='font-default'>
						{t('Color')}
					</Box>
					<FieldRow>
						<Controller
							control={control}
							name='color'
							render={({ field: { value, onChange } }) => (
								<LabelColorPicker value={value} onChange={onChange} aria-labelledby={colorLabelId} />
							)}
						/>
					</FieldRow>
				</Field>
				<Field>
					<Box id={iconLabelId} fontScale='p2m' color='font-default'>
						{t('Icon')}
					</Box>
					<FieldRow>
						<Controller
							control={control}
							name='icon'
							render={({ field: { value, onChange } }) => (
								<LabelIconPicker value={value} color={color} onChange={onChange} aria-labelledby={iconLabelId} />
							)}
						/>
					</FieldRow>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default LabelFormModal;
