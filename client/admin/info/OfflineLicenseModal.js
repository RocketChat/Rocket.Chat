import { Modal, Box, ButtonGroup, Button, Scrollable, Callout, Margins, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState, useEffect } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { useSetting, useSettingSetValue } from '../../contexts/SettingsContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

const OfflineLicenseModal = ({ onClose, license, ...props }) => {
	const t = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();

	const [newLicense, setNewLicense] = useState(license);
	const [isUpdating, setIsUpdating] = useState(false);

	const handleNewLicense = (e) => {
		setNewLicense(e.currentTarget.value);
	};

	const licenseStatus = useSetting('Enterprise_License_Status');
	const setLicense = useSettingSetValue('Enterprise_License');

	const hasChanges = license !== newLicense;

	const handlePaste = useMutableCallback(async () => {
		try {
			const text = await navigator.clipboard.readText();
			setNewLicense(text);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: `${ t('Paste_error') }: ${ error }` });
		}
	});

	console.log(licenseStatus);

	const handleApplyLicense = () => {
		setIsUpdating(true);
		setLicense(newLicense);
	};

	useEffect(() => {
		if (!isUpdating) {
			return;
		}

		setIsUpdating(false);

		if (licenseStatus === 'valid') {
			onClose();
			dispatchToastMessage({ type: 'success', message: t('Cloud_License_applied_successfully!') });
		}
	}, [dispatchToastMessage, isUpdating, licenseStatus, onClose, t]);

	return <Modal {...props}>
		<Modal.Header>
			<Modal.Title>{t('Cloud_Apply_Offline_License')}</Modal.Title>
			<Modal.Close onClick={onClose} />
		</Modal.Header>
		<Modal.Content>
			<Box withRichContent>
				<p>{t('Cloud_register_offline_finish_helper')}</p>
			</Box>
			<Box
				display='flex'
				flexDirection='column'
				alignItems='stretch'
				paddingInline='x16'
				pb='x8'
				flexGrow={1}
				backgroundColor='neutral-800'
				mb={!licenseStatus && 'x8'}
			>
				<Margins block='x8'>
					<Scrollable vertical>
						<Box
							is='textarea'
							height='x108'
							fontFamily='mono'
							fontScale='p1'
							color='alternative'
							style={{ wordBreak: 'break-all', resize: 'none' }}
							placeholder={t('Paste_here')}
							disabled={isUpdating}
							value={newLicense}
							autoComplete='off'
							autoCorrect='off'
							autoCapitalize='off'
							spellCheck='false'
							onChange={handleNewLicense}
						/>
					</Scrollable>
					<ButtonGroup align='start'>
						<Button primary small disabled={isUpdating} onClick={handlePaste}>
							<Icon name='clipboard' />
							{t('Paste')}
						</Button>
					</ButtonGroup>
				</Margins>
			</Box>
			{!licenseStatus && <Callout type='danger'>{t('Cloud_Invalid_license')}</Callout>}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button primary disabled={!hasChanges || isUpdating} onClick={handleApplyLicense}>
					{t('Cloud_Apply_license')}
				</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export default OfflineLicenseModal;
