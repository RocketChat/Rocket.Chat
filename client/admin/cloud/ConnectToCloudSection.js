import { Box, Button, ButtonGroup, Throbber } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import Subtitle from '../../components/basic/Subtitle';
import { useTranslation } from '../../contexts/TranslationContext';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

function ConnectToCloudSection({
	onRegisterStatusChange,
	...props
}) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [isConnecting, setConnecting] = useSafely(useState(false));

	const registerWorkspace = useMethod('cloud:registerWorkspace');
	const syncWorkspace = useMethod('cloud:syncWorkspace');

	const handleRegisterButtonClick = async () => {
		setConnecting(true);

		try {
			const isRegistered = await registerWorkspace();

			if (!isRegistered) {
				throw Error(t('An error occured'));
			}

			// TODO: sync on register?
			const isSynced = await syncWorkspace();

			if (!isSynced) {
				throw Error(t('An error occured syncing'));
			}

			dispatchToastMessage({ type: 'success', message: t('Sync Complete') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		} finally {
			await (onRegisterStatusChange && onRegisterStatusChange());
			setConnecting(false);
		}
	};

	return <Box is='section' {...props}>
		<Subtitle>{t('Cloud_registration_required')}</Subtitle>
		<Box withRichContent>
			<p>{t('Cloud_registration_required_description')}</p>
		</Box>
		<ButtonGroup>
			<Button primary disabled={isConnecting} minHeight='x40' onClick={handleRegisterButtonClick}>
				{isConnecting ? <Throbber is='span' inheritColor /> : t('Cloud_registration_required_link_text')}
			</Button>
		</ButtonGroup>
	</Box>;
}

export default ConnectToCloudSection;
