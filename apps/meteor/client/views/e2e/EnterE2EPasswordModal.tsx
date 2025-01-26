import { Box, PasswordInput, Field, FieldGroup, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import DOMPurify from 'dompurify';
import type { ChangeEvent, FormEvent, ReactElement } from 'react';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../components/GenericModal';

const EnterE2EPasswordModal = ({
	onConfirm,
	onClose,
	onCancel,
}: {
	onConfirm: (password: string) => void;
	onClose: () => void;
	onCancel: () => void;
}): ReactElement => {
	const { t } = useTranslation();
	const [password, setPassword] = useState('');
	const [passwordError, setPasswordError] = useState<string | undefined>();

	const handleChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			e.target.value !== '' && setPasswordError(undefined);
			setPassword(e.currentTarget.value);
		},
		[setPassword],
	);

	const handleConfirm = useEffectEvent((e: FormEvent): void => {
		e.preventDefault();
		if (password === '') {
			setPasswordError(t('Invalid_pass'));
			return;
		}

		return onConfirm(password);
	});

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={handleConfirm} {...props} />}
			variant='warning'
			title={t('Enter_E2E_password')}
			icon='warning'
			cancelText={t('Do_It_Later')}
			confirmText={t('Enable_encryption')}
			onClose={onClose}
			onCancel={onCancel}
		>
			<Box dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(t('E2E_password_request_text')) }} />
			<FieldGroup mbs={24} w='full'>
				<Field>
					<FieldRow>
						<PasswordInput error={passwordError} value={password} onChange={handleChange} placeholder={t('Please_enter_E2EE_password')} />
					</FieldRow>
					<FieldError>{passwordError}</FieldError>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default EnterE2EPasswordModal;
