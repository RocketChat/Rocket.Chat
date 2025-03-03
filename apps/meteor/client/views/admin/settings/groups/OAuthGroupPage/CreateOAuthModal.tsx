import { TextInput, Field, FieldLabel, FieldRow, FieldError, Box, FieldHint } from '@rocket.chat/fuselage';
import { useId, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../../../../components/GenericModal';

type CreateOAuthModalProps = {
	onConfirm: (text: string) => Promise<void>;
	onClose: () => void;
};

type CreateOAuthModalFields = {
	customOAuthName: string;
};

const CreateOAuthModal = ({ onConfirm, onClose }: CreateOAuthModalProps): ReactElement => {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<CreateOAuthModalFields>({
		defaultValues: {
			customOAuthName: '',
		},
	});

	const { t } = useTranslation();

	const customOAuthNameId = useId();

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(({ customOAuthName }) => onConfirm(customOAuthName))} {...props} />}
			title={t('Add_custom_oauth')}
			confirmText={t('Add')}
			onCancel={onClose}
			onClose={onClose}
		>
			<Field>
				<FieldLabel htmlFor={customOAuthNameId}>{t('Custom_OAuth_name')}</FieldLabel>
				<FieldRow>
					<TextInput
						id={customOAuthNameId}
						{...register('customOAuthName', { required: t('Required_field', { field: t('Custom_OAuth_name') }) })}
						aria-required='true'
						aria-describedby={`${customOAuthNameId}-error ${customOAuthNameId}-hint`}
						aria-label={t('Custom_OAuth_name')}
					/>
				</FieldRow>
				<FieldHint id={`${customOAuthNameId}-hint`}>{t('Custom_OAuth_name_hint')}</FieldHint>
				{errors.customOAuthName && (
					<FieldError aria-live='assertive' id={`${customOAuthNameId}-error`}>
						{errors.customOAuthName.message}
					</FieldError>
				)}
			</Field>
		</GenericModal>
	);
};

export default CreateOAuthModal;
