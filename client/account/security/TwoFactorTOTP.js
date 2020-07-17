import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Box, Button, TextInput, Icon, ButtonGroup, Margins, Modal } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import qrcode from 'yaqrcode';

import { useUser } from '../../contexts/UserContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useSetModal } from '../../contexts/ModalContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useForm } from '../../hooks/useForm';
import { useMethod } from '../../contexts/ServerContext';
import TextCopy from '../../components/basic/TextCopy';

const BackupCodesModal = ({ codes, onClose, ...props }) => {
	const t = useTranslation();

	const codesText = useMemo(() => codes.join(' '), [codes]);

	return <Modal {...props}>
		<Modal.Header>
			<Icon name='info' size={20}/>
			<Modal.Title>{t('Backup_codes')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<Box mb='x8' withRichContent>{t('Make_sure_you_have_a_copy_of_your_codes_1')}</Box>
			<TextCopy text={codesText} wordBreak='break-word' mb='x8' />
			<Box mb='x8' withRichContent>{t('Make_sure_you_have_a_copy_of_your_codes_2')}</Box>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary onClick={onClose}>{t('Ok')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

const VerifyCodeModal = ({ onVerify, onCancel, ...props }) => {
	const t = useTranslation();

	const ref = useRef();

	useEffect(() => {
		if (typeof ref?.current?.focus === 'function') {
			ref.current.focus();
		}
	}, [ref]);

	const { values, handlers } = useForm({ code: '' });

	const { code } = values;
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

const TwoFactorTOTP = (props) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const user = useUser();
	const setModal = useSetModal();

	const enableTotpFn = useMethod('2fa:enable');
	const disableTotpFn = useMethod('2fa:disable');
	const verifyCodeFn = useMethod('2fa:validateTempToken');
	const checkCodesRemainingFn = useMethod('2fa:checkCodesRemaining');
	const regenerateCodesFn = useMethod('2fa:regenerateCodes');

	const [registeringTotp, setRegisteringTotp] = useSafely(useState(false));
	const [qrCode, setQrCode] = useSafely(useState());
	const [totpSecret, setTotpSecret] = useSafely(useState());
	const [codesRemaining, setCodesRemaining] = useSafely(useState());

	const { values, handlers } = useForm({ authCode: '' });

	const { authCode } = values;
	const { handleAuthCode } = handlers;

	const totpEnabled = user && user.services && user.services.totp && user.services.totp.enabled;

	const closeModal = useCallback(() => setModal(null), [setModal]);

	useEffect(() => {
		const updateCodesRemaining = async () => {
			if (!totpEnabled) { return false; }
			const result = await checkCodesRemainingFn();
			setCodesRemaining(result.remaining);
		};
		updateCodesRemaining();
	}, [checkCodesRemainingFn, setCodesRemaining, totpEnabled]);

	const handleEnableTotp = useCallback(async () => {
		try {
			const result = await enableTotpFn();

			setTotpSecret(result.secret);
			setQrCode(qrcode(result.url, { size: 200 }));

			setRegisteringTotp(true);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, enableTotpFn, setQrCode, setRegisteringTotp, setTotpSecret]);

	const handleDisableTotp = useCallback(async () => {
		const onDisable = async (authCode) => {
			try {
				const result = await disableTotpFn(authCode);

				if (!result) {
					return dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
				}

				dispatchToastMessage({ type: 'success', message: t('Two-factor_authentication_disabled') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			closeModal();
		};

		setModal(<VerifyCodeModal onVerify={onDisable} onCancel={closeModal}/>);
	}, [closeModal, disableTotpFn, dispatchToastMessage, setModal, t]);

	const handleVerifyCode = useCallback(async () => {
		try {
			const result = await verifyCodeFn(authCode);

			if (!result) {
				return dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
			}
			setModal(<BackupCodesModal codes={result.codes} onClose={closeModal}/>);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [authCode, closeModal, dispatchToastMessage, setModal, t, verifyCodeFn]);

	const handleRegenerateCodes = useCallback(() => {
		const onRegenerate = async (authCode) => {
			try {
				const result = await regenerateCodesFn(authCode);

				if (!result) {
					return dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
				}
				setModal(<BackupCodesModal codes={result.codes} onClose={closeModal}/>);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
		};

		setModal(<VerifyCodeModal onVerify={onRegenerate} onCancel={closeModal}/>);
	}, [closeModal, dispatchToastMessage, regenerateCodesFn, setModal, t]);

	return <Box display='flex' flexDirection='column' alignItems='flex-start' {...props}>
		<Margins blockEnd='x8'>
			<Box fontScale='s2'>{t('Two-factor_authentication')}</Box>
			{!totpEnabled && !registeringTotp && <>
				<Box>{t('Two-factor_authentication_is_currently_disabled')}</Box>
				<Button primary onClick={handleEnableTotp}>{t('Enable_two-factor_authentication')}</Button>
			</>}
			{!totpEnabled && registeringTotp && <>
				<Box>{t('Scan_QR_code')}</Box>
				<Box>{t('Scan_QR_code_alternative_s')}</Box>
				<TextCopy text={totpSecret}/>
				<Box is='img' size='x200' src={qrCode} aria-hidden='true'/>
				<Box display='flex' flexDirection='row' w='full'>
					<TextInput placeholder={t('Enter_authentication_code')} value={authCode} onChange={handleAuthCode}/>
					<Button primary onClick={handleVerifyCode}>{t('Verify')}</Button>
				</Box>
			</>}
			{totpEnabled && <>
				<Button primary danger onClick={handleDisableTotp}>{t('Disable_two-factor_authentication')}</Button>
				<Box fontScale='p2' mbs='x8'>{t('Backup_codes')}</Box>
				<Box>{t('You_have_n_codes_remaining', { number: codesRemaining })}</Box>
				<Button onClick={handleRegenerateCodes}>{t('Regenerate_codes')}</Button>
			</>}
		</Margins>
	</Box>;
};

export default TwoFactorTOTP;
