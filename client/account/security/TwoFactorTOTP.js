import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Button, TextInput, Icon, ButtonGroup, Margins } from '@rocket.chat/fuselage';
import qrcode from 'yaqrcode';

import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useForm } from '../../hooks/useForm';
import { useMethod } from '../../contexts/ServerContext';
import { Modal } from '../../components/basic/Modal';

const mapCodes = (codes) => codes.map((code, index) => ((index + 1) % 4 === 0 ? `${ code }\n` : code)).join(' ');

const BackupCodesModal = ({ codes, onClose, ...props }) => {
	const t = useTranslation();

	return <Modal {...props}>
		<Modal.Header>
			<Icon name='info' size={20}/>
			<Modal.Title>{t('Backup_codes')}</Modal.Title>
			<Modal.Close onClick={onClose}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			<Box mb='x8' withRichContent dangerouslySetInnerHTML={{ __html: t('Make_sure_you_have_a_copy_of_your_codes', { codes }) }} />
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

	const ref = useRef({});

	useEffect(() => {
		if (typeof ref.current?.focus === 'function') {
			ref.current.focus();
		}
	}, [ref]);

	const { values, handlers } = useForm({ code: '' });

	const { code } = values;
	const { handleCode } = handlers;

	const handleVerify = useCallback((e) => {
		if (e.type === 'click' || (e.type === 'keydown' && e.keyCode === 13)) {
			onVerify(code); onCancel();
		}
	}, [code, onCancel, onVerify]);

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

const TwoFactorTOTP = ({ setModal, user, ...props }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const enableTotpFn = useMethod('2fa:enable');
	const disableTotpFn = useMethod('2fa:disable');
	const verifyCodeFn = useMethod('2fa:validateTempToken');
	const checkCodesRemainingFn = useMethod('2fa:checkCodesRemaining');
	const regenerateCodesFn = useMethod('2fa:regenerateCodes');

	const [registeringTotp, setRegisteringTotp] = useState(false);
	const [qrCode, setQrCode] = useState();
	const [totpSecret, setTotpSecret] = useState();
	const [codesRemaining, setCodesRemaining] = useState();

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
	}, [checkCodesRemainingFn, totpEnabled]);

	const handleEnableTotp = useCallback(async () => {
		try {
			const result = await enableTotpFn();

			setTotpSecret(result.secret);
			setQrCode(qrcode(result.url, { size: 200 }));

			setRegisteringTotp(true);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [dispatchToastMessage, enableTotpFn]);

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
		};

		setModal(<VerifyCodeModal onVerify={onDisable} onCancel={closeModal}/>);
	}, [closeModal, disableTotpFn, dispatchToastMessage, setModal, t]);

	const handleVerifyCode = useCallback(async () => {
		try {
			const result = await verifyCodeFn(authCode);

			if (!result) {
				return dispatchToastMessage({ type: 'error', message: t('Invalid_two_factor_code') });
			}
			const codes = `<pre><code> ${ mapCodes(result.codes) }</pre></code>`;
			setModal(<BackupCodesModal codes={codes} onClose={closeModal}/>);
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
				const codes = `<pre><code> ${ mapCodes(result.codes) }</pre></code>`;
				setModal(<BackupCodesModal codes={codes} onClose={closeModal}/>);
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
				<Box>{t('Scan_QR_code_alternative_s', { code: totpSecret })}</Box>
				<Box is='img' size='x200' src={qrCode}/>
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
