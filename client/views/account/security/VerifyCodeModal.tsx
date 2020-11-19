import React, { FC, useCallback, useEffect, useRef } from 'react';
import { Box, Button, TextInput, Icon, ButtonGroup, Modal } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useForm } from '../../../hooks/useForm';

type VerifyCodeModalProps = {
	onVerify: (code: string) => void;
	onCancel: () => void;
};

const VerifyCodeModal: FC<VerifyCodeModalProps> = ({ onVerify, onCancel, ...props }) => {
	const t = useTranslation();

	const ref = useRef<HTMLInputElement>();

	useEffect(() => {
		if (typeof ref?.current?.focus === 'function') {
			ref.current.focus();
		}
	}, [ref]);

	const { values, handlers } = useForm({ code: '' });

	const { code } = values as { code: string };
	const { handleCode } = handlers;

	const handleVerify = useCallback((e) => {
		if (e.type === 'click' || (e.type === 'keydown' && e.keyCode === 13)) {
			onVerify(code);
		}
	}, [code, onVerify]);

	return <Modal {...props}>
		<Modal.Header>
			<Icon name='info' size={20}/>
			<Modal.Title>{t('Two-factor_authentication')}</Modal.Title>
			<Modal.Close onClick={onCancel}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<Box mbe='x8'>{t('Open_your_authentication_app_and_enter_the_code')}</Box>
			<Box display='flex' alignItems='stretch'>
				<TextInput ref={ref} placeholder={t('Enter_authentication_code')} value={code} onChange={handleCode} onKeyDown={handleVerify}/>
			</Box>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button onClick={onCancel}>{t('Cancel')}</Button>
				<Button primary onClick={handleVerify}>{t('Verify')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default VerifyCodeModal;
