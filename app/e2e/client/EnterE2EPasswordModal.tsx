import { Box, PasswordInput, Field, FieldGroup } from '@rocket.chat/fuselage';
import React, { FC, useState, useCallback } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import GenericModal from '../../../client/components/GenericModal';
import { useTranslation } from '../../../client/contexts/TranslationContext';

type EnterE2EPasswordModalProps = {
	onConfirm: (password: string) => void;
	onClose: () => void;
};

const EnterE2EPasswordModal: FC<EnterE2EPasswordModalProps> = ({ onConfirm, ...props }) => {
	const t = useTranslation();
	const [password, setPassword] = useState('');
	const [passwordError, setPasswordError] = useState<string | undefined>();

	const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		e.target.value !== '' && setPasswordError(undefined);
		setPassword(e.currentTarget.value);
	}, [setPassword]);


	const handleConfirm = useMutableCallback((): void => {
		if (password === '') {
			setPasswordError(t('Invalid_pass'));
			return;
		}

		return onConfirm(password);
	});

	return (
		<GenericModal
			variant='warning'
			title={t('Enter_E2E_password')}
			cancelText={t('I_ll_do_it_later')}
			confirmText={t('Decode_Key')}
			onConfirm={handleConfirm}
			{...props}
		>
			<Box dangerouslySetInnerHTML={{ __html: t('E2E_password_request_text') }} />
			<FieldGroup mbs='x24' w='full'>
				<Field>
					<Field.Row>
						<PasswordInput
							error={passwordError}
							value={password}
							onChange={handleChange}
							placeholder={t('New_Password_Placeholder')}
						/>
					</Field.Row>
					<Field.Error>{passwordError}</Field.Error>
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default EnterE2EPasswordModal;
