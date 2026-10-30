import type { IPasskey } from '@rocket.chat/core-typings';
import { Field, FieldError, FieldHint, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import ModalForm from './layout/ModalForm';
import { useEndpointMutation } from '../../../hooks/useEndpointMutation';
import { passkeysQueryKeys } from '../../../lib/queryKeys';

const MAX_NAME_LENGTH = 64;

export type PasskeyNameModalProps = {
	passkey: Pick<IPasskey, '_id' | 'name'>;
	/** The passkey was just added: the user is offered to name it, and may skip */
	isNew?: boolean;
	onClose: () => void;
};

const PasskeyNameModal = ({ passkey, isNew = false, onClose }: PasskeyNameModalProps) => {
	const { t } = useTranslation();
	const nameId = useId();
	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm({ defaultValues: { name: passkey.name } });

	const { mutate: renamePasskey, isPending } = useEndpointMutation('POST', '/v1/passkeys.rename', {
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: passkeysQueryKeys.all });
			if (!isNew) {
				dispatchToastMessage({ type: 'success', message: t('Passkey_renamed') });
			}
			onClose();
		},
	});

	const handleSave = ({ name }: { name: string }) => {
		if (name.trim() === passkey.name) {
			onClose();
			return;
		}

		renamePasskey({ passkeyId: passkey._id, name: name.trim() });
	};

	return (
		<GenericModal
			wrapperFunction={(props) => <ModalForm noValidate onSubmit={handleSubmit(handleSave)} {...props} />}
			variant={isNew ? 'success' : 'info'}
			icon={isNew ? undefined : null}
			title={isNew ? t('Passkey_added') : t('Rename_passkey')}
			confirmText={t('Save')}
			cancelText={isNew ? t('Skip') : t('Cancel')}
			confirmLoading={isPending}
			onCancel={onClose}
			onClose={onClose}
		>
			<Field>
				<FieldLabel htmlFor={nameId} required>
					{t('Passkey_name')}
				</FieldLabel>
				<FieldRow>
					<TextInput
						id={nameId}
						autoFocus
						maxLength={MAX_NAME_LENGTH}
						aria-describedby={`${nameId}-hint ${nameId}-error`}
						aria-invalid={errors.name ? 'true' : 'false'}
						error={errors.name?.message}
						{...register('name', {
							validate: (name) => name.trim().length > 0 || t('Required_field', { field: t('Passkey_name') }),
						})}
					/>
				</FieldRow>
				<FieldHint id={`${nameId}-hint`}>{t('Passkey_name_hint')}</FieldHint>
				{errors.name && (
					<FieldError role='alert' id={`${nameId}-error`}>
						{errors.name.message}
					</FieldError>
				)}
			</Field>
		</GenericModal>
	);
};

export default PasskeyNameModal;
