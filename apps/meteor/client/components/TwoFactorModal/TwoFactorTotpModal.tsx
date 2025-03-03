import { Box, TextInput, Field, FieldGroup, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import type { ReactElement, ChangeEvent, SyntheticEvent } from 'react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../GenericModal';
import type { OnConfirm } from './TwoFactorModal';
import { Method } from './TwoFactorModal';

type TwoFactorTotpModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
	onDismiss?: () => void;
	invalidAttempt?: boolean;
};

const TwoFactorTotpModal = ({ onConfirm, onClose, onDismiss, invalidAttempt }: TwoFactorTotpModalProps): ReactElement => {
	const { t } = useTranslation();
	const [code, setCode] = useState<string>('');
	const ref = useAutoFocus<HTMLInputElement>();

	const onConfirmTotpCode = (e: SyntheticEvent): void => {
		e.preventDefault();
		onConfirm(code, Method.TOTP);
	};

	const onChange = ({ currentTarget }: ChangeEvent<HTMLInputElement>): void => {
		setCode(currentTarget.value);
	};

	const id = useId();
	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={onConfirmTotpCode} {...props} />}
			onCancel={onClose}
			confirmText={t('Verify')}
			title={t('Enter_TOTP_password')}
			onClose={onClose}
			onDismiss={onDismiss}
			variant='warning'
			confirmDisabled={!code}
			tagline={t('Two-factor_authentication')}
			icon={null}
		>
			<FieldGroup>
				<Field>
					<FieldLabel alignSelf='stretch' htmlFor={id}>
						{t('Enter_the_code_provided_by_your_authentication_app_to_continue')}
					</FieldLabel>
					<FieldRow>
						<TextInput id={id} ref={ref} value={code} onChange={onChange} placeholder={t('Enter_code_here')}></TextInput>
					</FieldRow>
					{invalidAttempt && <FieldError>{t('Invalid_password')}</FieldError>}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default TwoFactorTotpModal;
