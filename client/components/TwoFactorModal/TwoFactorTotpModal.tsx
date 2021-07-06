import { Box, TextInput, Icon } from '@rocket.chat/fuselage';
import { useAutoFocus } from '@rocket.chat/fuselage-hooks';
import React, { ReactElement, useState, ChangeEvent } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import GenericModal from '../GenericModal';
import { Method, OnConfirm } from './TwoFactorModal';

type TwoFactorTotpModalProps = {
	onConfirm: OnConfirm;
	onClose: () => void;
};

const TwoFactorTotpModal = ({ onConfirm, onClose }: TwoFactorTotpModalProps): ReactElement => {
	const t = useTranslation();
	const [code, setCode] = useState<string>('');
	const ref = useAutoFocus();

	const onConfirmTotpCode = (): void => {
		onConfirm(code, Method.TOTP);
	};

	const onChange = ({ currentTarget }: ChangeEvent<HTMLInputElement>): void => {
		setCode(currentTarget.value);
	};

	return (
		<GenericModal
			onConfirm={onConfirmTotpCode}
			onCancel={onClose}
			confirmText={t('Verify')}
			title={t('Two Factor Authentication')}
			onClose={onClose}
			variant='warning'
			icon={<Icon size='x20' name='info' color='default' />}
			confirmDisabled={!code}
		>
			<Box mbe='x16'>{t('Open_your_authentication_app_and_enter_the_code')}</Box>
			<Box mbe='x16' display='flex' justifyContent='stretch'>
				<TextInput
					ref={ref}
					value={code}
					onChange={onChange}
					placeholder={t('Enter_authentication_code')}
				></TextInput>
			</Box>
		</GenericModal>
	);
};

export default TwoFactorTotpModal;
