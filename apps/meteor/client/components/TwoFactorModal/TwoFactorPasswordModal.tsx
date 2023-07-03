import { Box, PasswordInput, FieldGroup, Field } from '@rocket.chat/fuselage';
import { useAutoFocus, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent, Ref, SyntheticEvent } from 'react';
import React, { useState } from 'react';

import GenericModal from '../GenericModal';
import type { OnConfirm } from './TwoFactorModal';
import { Method } from './TwoFactorModal';

type TwoFactorPasswordModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
	invalidAttempt?: boolean;
};

const TwoFactorPasswordModal = ({ onConfirm, onClose, invalidAttempt }: TwoFactorPasswordModalProps): ReactElement => {
	const t = useTranslation();
	const [code, setCode] = useState<string>('');
	const ref = useAutoFocus();

	const onConfirmTotpCode = (e: SyntheticEvent): void => {
		e.preventDefault();
		onConfirm(code, Method.PASSWORD);
	};

	const onChange = ({ currentTarget }: ChangeEvent<HTMLInputElement>): void => {
		setCode(currentTarget.value);
	};

	const id = useUniqueId();

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={onConfirmTotpCode} {...props} />}
			onCancel={onClose}
			confirmText={t('Verify')}
			title={t('Please_enter_your_password')}
			onClose={onClose}
			variant='warning'
			icon='info'
			confirmDisabled={!code}
		>
			<FieldGroup>
				<Field>
					<Field.Label alignSelf='stretch' htmlFor={id}>
						{t('For_your_security_you_must_enter_your_current_password_to_continue')}
					</Field.Label>
					<Field.Row>
						<PasswordInput
							id={id}
							ref={ref as Ref<HTMLInputElement>}
							value={code}
							onChange={onChange}
							placeholder={t('Password')}
						></PasswordInput>
					</Field.Row>
					{invalidAttempt && <Field.Error>{t('Invalid_password')}</Field.Error>}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default TwoFactorPasswordModal;
