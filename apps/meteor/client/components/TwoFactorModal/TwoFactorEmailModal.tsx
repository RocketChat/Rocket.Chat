import { Box, FieldGroup, TextInput, Field, FieldLabel, FieldRow, FieldError } from '@rocket.chat/fuselage';
import { useAutoFocus, useUniqueId } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, ChangeEvent, SyntheticEvent } from 'react';
import React, { useState } from 'react';

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
	const t = useTranslation();
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

	const id = useUniqueId();
	const onCloseHandler = () => {
		try {
			if (typeof onClose === 'function') {
				onClose();
				// Change the URL without triggering a full page reload
				window.location.href = 'http://localhost:3000';
			}
		} catch (error) {
			console.error('Error in onClose function:', error);
		}
	};

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={onConfirmEmailCode} {...props} />}
			onCancel={onClose}
			confirmText={t('Verify')}
			title={t('Two-factor_authentication_email')}
			onClose={onClose}
			onClick={onCloseHandler}
			variant='warning'
			icon='info'
			confirmDisabled={!code}
		>
			<FieldGroup>
				<Field>
					<FieldLabel alignSelf='stretch' htmlFor={id}>
						{t('Verify_your_email_with_the_code_we_sent')}
					</FieldLabel>
					<FieldRow>
						<TextInput id={id} ref={ref} value={code} onChange={onChange} placeholder={t('Enter_authentication_code')} />
					</FieldRow>
					{invalidAttempt && <FieldError>{t('Invalid_password')}</FieldError>}
				</Field>
			</FieldGroup>
			<Box style={{ cursor: 'pointer' }} display='flex' justifyContent='end' is='a' onClick={onClickResendCode}>
				{t('Cloud_resend_email')}
			</Box>
		</GenericModal>
	);
};

export default TwoFactorEmailModal;
