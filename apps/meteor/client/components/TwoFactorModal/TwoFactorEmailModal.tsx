import { Box, FieldGroup, TextInput, Field, FieldLabel, FieldRow, FieldError, Button } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent, SyntheticEvent } from 'react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../GenericModal';
import type { OnConfirm } from './TwoFactorModal';
import { Method } from './TwoFactorModal';

type TwoFactorEmailModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
	emailOrUsername: string;
	invalidAttempt?: boolean;
};

const TwoFactorEmailModal = ({ onConfirm, onClose, emailOrUsername, invalidAttempt }: TwoFactorEmailModalProps): ReactElement => {
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();
	const [code, setCode] = useState<string>('');
	const ref = useAutoFocus<HTMLInputElement>();

	const sendEmailCode = useEndpoint('POST', '/v1/users.2fa.sendEmailCode');

	const onClickResendCode = async (): Promise<void> => {
		try {
			await sendEmailCode({ emailOrUsername });
			dispatchToastMessage({ type: 'success', message: t('Email_sent') });
		} catch (error) {
			dispatchToastMessage({
				type: 'error',
				message: t('error-email-send-failed', { message: error }),
			});
		}
	};

	const onConfirmEmailCode = (e: SyntheticEvent): void => {
		e.preventDefault();
		onConfirm(code, Method.EMAIL);
	};

	const onChange = ({ currentTarget }: ChangeEvent<HTMLInputElement>): void => {
		setCode(currentTarget.value);
	};

	const id = useId();

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={onConfirmEmailCode} {...props} />}
			onCancel={onClose}
			confirmText={t('Verify')}
			title={t('Enter_authentication_code')}
			onClose={onClose}
			variant='warning'
			confirmDisabled={!code}
			tagline={t('Email_two-factor_authentication')}
			icon={null}
		>
			<FieldGroup>
				<Field>
					<FieldLabel alignSelf='stretch' htmlFor={id}>
						{t('Enter_the_code_we_just_emailed_you')}
					</FieldLabel>
					<FieldRow>
						<TextInput id={id} ref={ref} value={code} onChange={onChange} placeholder={t('Enter_code_here')} />
					</FieldRow>
					{invalidAttempt && <FieldError>{t('Invalid_password')}</FieldError>}
				</Field>
			</FieldGroup>
			<Button display='flex' justifyContent='end' onClick={onClickResendCode} small mbs={24}>
				{t('Cloud_resend_email')}
			</Button>
		</GenericModal>
	);
};

export default TwoFactorEmailModal;
