import { Box, Field, FieldLabel, FieldRow, TextInput } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GenericModal } from '@rocket.chat/ui-contexts';

type PasskeyCreateModalProps = {
	onConfirm: (name: string) => void;
	onClose: () => void;
};

const PasskeyCreateModal = ({ onConfirm, onClose }: PasskeyCreateModalProps): ReactElement => {
	const { t } = useTranslation();
	const [name, setName] = useState();

	const handleConfirm = () => {
		if (name && name.trim()) {
			onConfirm(name.trim());
		}
	};

	return (
		<GenericModal title={t('Add_a_passkey')} onConfirm={handleConfirm} onClose={onClose} confirmText={t('Add_passkey')}>
			<Box mb='x8'>
				{t(
					'Your_device_supports_passkeys,_a_password_replacement_that_validates_your_identity_using_touch,_facial_recognition,_a_device_password,_or_a_PIN.',
				)}
			</Box>
			<Box mb='x16'>
				{t('Passkeys_can_be_used_for_sign-in_as_a_simple_and_secure_alternative_to_your_password_and_two-factor_credentials.')}
			</Box>
			<Field>
				<FieldLabel>{t('Passkey_name')}</FieldLabel>
				<FieldRow>
					<TextInput
						value={name}
						onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.currentTarget.value)}
						placeholder={t('Enter_a_name_for_this_passkey')}
					/>
				</FieldRow>
			</Field>
		</GenericModal>
	);
};

export default PasskeyCreateModal;
