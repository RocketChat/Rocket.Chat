import { Box, FieldGroup, Field, FieldLabel, FieldRow, FieldError, InputBox } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { GenericModal } from '@rocket.chat/ui-client';
import type { ReactElement, ChangeEvent, SyntheticEvent } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
	const inputId = 'totp-code';

	const onConfirmTotpCode = (e: SyntheticEvent): void => {
		e.preventDefault();
		onConfirm(code, Method.TOTP);
	};

	const onChange = ({ currentTarget }: ChangeEvent<HTMLInputElement>): void => {
		setCode(currentTarget.value);
	};

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
					<FieldLabel alignSelf='stretch' htmlFor={inputId}>
						{t('Enter_the_code_provided_by_your_authentication_app_to_continue')}
					</FieldLabel>
					<FieldRow>
						<InputBox
							id={inputId}
							name='totp'
							ref={ref}
							value={code}
							onChange={onChange}
							placeholder={t('Enter_code_here')}
							inputMode='numeric'
							autoComplete='one-time-code'
							type='text'
							htmlSize={6}
						/>
					</FieldRow>
					{invalidAttempt && <FieldError>{t('Invalid_password')}</FieldError>}
				</Field>
			</FieldGroup>
		</GenericModal>
	);
};

export default TwoFactorTotpModal;
