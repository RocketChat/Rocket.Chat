import { Box, TextInput, Icon } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useState, ChangeEvent } from 'react';

import GenericModal from '../GenericModal';
import { Method, OnConfirm } from './TwoFactorModal';

type TwoFactorEmailModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
	emailOrUsername: string;
};

const TwoFactorEmailModal = ({ onConfirm, onClose, emailOrUsername }: TwoFactorEmailModalProps): ReactElement => {
	const dispatchToastMessage = useToastMessageDispatch();
	const t = useTranslation();
	const [code, setCode] = useState<string>('');
	const ref = useAutoFocus<HTMLInputElement>();

	const sendEmailCode = useEndpoint('POST', 'users.2fa.sendEmailCode');

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

	const onConfirmEmailCode = (): void => {
		onConfirm(code, Method.EMAIL);
	};

	const onChange = ({ currentTarget }: ChangeEvent<HTMLInputElement>): void => {
		setCode(currentTarget.value);
	};

	return (
		<GenericModal
			onConfirm={onConfirmEmailCode}
			onCancel={onClose}
			confirmText={t('Verify')}
			title={t('Two-factor_authentication_email')}
			onClose={onClose}
			variant='warning'
			icon={<Icon size='x20' name='info' color='default' />}
			confirmDisabled={!code}
		>
			<Box mbe='x16'>{t('Verify_your_email_for_the_code_we_sent')}</Box>
			<Box mbe='x4' display='flex' justifyContent='stretch'>
				<TextInput ref={ref} value={code} onChange={onChange} placeholder={t('Enter_authentication_code')} />
			</Box>
			<Box display='flex' justifyContent='end' is='a' onClick={onClickResendCode}>
				{t('Cloud_resend_email')}
			</Box>
		</GenericModal>
	);
};

export default TwoFactorEmailModal;
