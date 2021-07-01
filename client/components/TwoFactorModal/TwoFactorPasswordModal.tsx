import { Box, PasswordInput, Icon } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, useState, ChangeEvent, Ref } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import GenericModal from '../GenericModal';
import { Method, OnConfirm } from './TwoFactorModal';

type TwoFactorPasswordModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
};

const TwoFactorPasswordModal = ({
	onConfirm,
	onClose,
}: TwoFactorPasswordModalProps): ReactElement => {
	const t = useTranslation();
	const [code, setCode] = useState<string>('');
	const ref = useAutoFocus();

	const onConfirmTotpCode = (): void => {
		onConfirm(code, Method.PASSWORD);
	};

	const onChange = ({ currentTarget }: ChangeEvent<HTMLInputElement>): void => {
		setCode(currentTarget.value);
	};

	return (
		<GenericModal
			onConfirm={onConfirmTotpCode}
			onCancel={onClose}
			confirmText={t('Verify')}
			title={t('Please_enter_your_password')}
			onClose={onClose}
			variant='warning'
			icon={<Icon size='x20' name='info' color='default' />}
			confirmDisabled={!code}
		>
			<Box mbe='x16'>{t('For_your_security_you_must_enter_your_current_password_to_continue')}</Box>
			<Box mbe='x16' display='flex' justifyContent='stretch'>
				<PasswordInput
					ref={ref as Ref<HTMLInputElement>}
					value={code}
					onChange={onChange}
					placeholder={t('Password')}
				></PasswordInput>
			</Box>
		</GenericModal>
	);
};

export default TwoFactorPasswordModal;
