import { Box, Button, ButtonGroup, Icon, Scrollable, Throbber, Modal } from '@rocket.chat/fuselage';
import Clipboard from 'clipboard';
import React, { useEffect, useState, useRef } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod, useEndpoint } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';
import MarkdownText from '../../components/basic/MarkdownText';
import { cloudConsoleUrl } from './constants';

function CopyStep({ onNextButtonClick }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [clientKey, setClientKey] = useState('');

	const getWorkspaceRegisterData = useMethod('cloud:getWorkspaceRegisterData');

	useEffect(() => {
		const loadWorkspaceRegisterData = async () => {
			const clientKey = await getWorkspaceRegisterData();
			setClientKey(clientKey);
		};

		loadWorkspaceRegisterData();
	}, [getWorkspaceRegisterData]);

	const copyRef = useRef();

	useEffect(function() {
		const clipboard	= new Clipboard(copyRef.current);
		clipboard.on('success', () => {
			dispatchToastMessage({ type: 'success', message: t('Copied') });
		});

		return () => {
			clipboard.destroy();
		};
	}, [dispatchToastMessage, t]);

	return <>
		<Modal.Content>
			<Box withRichContent>
				<p>{t('Cloud_register_offline_helper')}</p>
			</Box>
			<Box
				display='flex'
				flexDirection='column'
				alignItems='stretch'
				padding='x16'
				flexGrow={1}
				backgroundColor='neutral-800'
			>
				<Scrollable vertical>
					<Box
						height='x108'
						fontFamily='mono'
						fontScale='p1'
						color='alternative'
						style={{ wordBreak: 'break-all' }}
					>
						{clientKey}
					</Box>
				</Scrollable>
				<Button ref={copyRef} primary data-clipboard-text={clientKey}>
					<Icon name='copy' /> {t('Copy')}
				</Button>
			</Box>
			<MarkdownText is='p' preserveHtml={true} withRichContent content={t('Cloud_click_here', { cloudConsoleUrl })} />
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup>
				<Button primary onClick={onNextButtonClick}>{t('Next')}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</>;
}

function PasteStep({ onBackButtonClick, onFinish }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [isLoading, setLoading] = useState(false);
	const [cloudKey, setCloudKey] = useState('');

	const handleCloudKeyChange = (e) => {
		setCloudKey(e.currentTarget.value);
	};

	const registerManually = useEndpoint('POST', 'cloud.manualRegister');

	const handleFinishButtonClick = async () => {
		setLoading(true);

		try {
			await registerManually({}, { cloudBlob: cloudKey });
			dispatchToastMessage({ type: 'success', message: t('Cloud_register_success') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: t('Cloud_register_error') });
		} finally {
			setLoading(false);
			onFinish && onFinish();
		}
	};

	return <>
		<Modal.Content>
			<Box withRichContent>
				<p>{t('Cloud_register_offline_finish_helper')}</p>
			</Box>
			<Box
				display='flex'
				flexDirection='column'
				alignItems='stretch'
				padding='x16'
				flexGrow={1}
				backgroundColor='neutral-800'
			>
				<Scrollable vertical>
					<Box
						is='textarea'
						height='x108'
						fontFamily='mono'
						fontScale='p1'
						color='alternative'
						style={{ wordBreak: 'break-all', resize: 'none' }}
						placeholder={t('Paste_here')}
						disabled={isLoading}
						value={cloudKey}
						autoComplete='off'
						autoCorrect='off'
						autoCapitalize='off'
						spellCheck='false'
						onChange={handleCloudKeyChange}
					/>
				</Scrollable>
			</Box>
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup>
				<Button disabled={isLoading} onClick={onBackButtonClick}>{t('Back')}</Button>
				<Button primary disabled={isLoading || !cloudKey.trim()} marginInlineStart='auto' onClick={handleFinishButtonClick}>
					{isLoading ? <Throbber inheritColor /> : t('Finish Registration')}
				</Button>
			</ButtonGroup>
		</Modal.Footer>
	</>;
}

const Steps = {
	COPY: 'copy',
	PASTE: 'paste',
};

function ManualWorkspaceRegistrationModal({ onClose, props }) {
	const t = useTranslation();

	const [step, setStep] = useState(Steps.COPY);

	const handleNextButtonClick = () => {
		setStep(Steps.PASTE);
	};

	const handleBackButtonClick = () => {
		setStep(Steps.COPY);
	};

	return <Modal {...props}>
		<Modal.Header>
			<Modal.Title>{t('Cloud_Register_manually')}</Modal.Title>
			<Modal.Close onClick={onClose} />
		</Modal.Header>
		{(step === Steps.COPY && <CopyStep onNextButtonClick={handleNextButtonClick} />)
		|| (step === Steps.PASTE && <PasteStep onBackButtonClick={handleBackButtonClick} onFinish={onClose} />)}
	</Modal>;
}

export default ManualWorkspaceRegistrationModal;
