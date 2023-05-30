import { Box, TextInput, Field, FieldGroup } from '@rocket.chat/fuselage';
import { useAutoFocus, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent, SyntheticEvent } from 'react';
import React, { useState } from 'react';

import GenericModal from '../GenericModal';
import type { OnConfirm } from './TwoFactorModal';
import { Method } from './TwoFactorModal';

type TwoFactorTotpModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
	invalidAttempt?: boolean;
};

const TwoFactorTotpModal = ({ onConfirm, onClose, invalidAttempt }: TwoFactorTotpModalProps): ReactElement => {
	const t = useTranslation();
	const [code, setCode] = useState<string>('');
	const ref = useAutoFocus<HTMLInputElement>();

	const onConfirmTotpCode = (e: SyntheticEvent): void => {
		e.preventDefault();
		onConfirm(code, Method.TOTP);
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
			title={t('Two Factor Authentication')}
			onClose={onClose}
			variant='warning'
			icon='info'
			confirmDisabled={!code}
		>
			<FieldGroup>
				<Field>
					<Field.Label alignSelf='stretch' htmlFor={id}>
						{t('Open_your_authentication_app_and_enter_the_code')}
					</Field.Label>
					<Field.Row>
						<TextInput id={id} ref={ref} value={code} onChange={onChange} placeholder={t('Enter_authentication_code')}></TextInput>
					</Field.Row>
					{invalidAttempt && <Field.Error>{t('Invalid_password')}</Field.Error>}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default TwoFactorTotpModal;
