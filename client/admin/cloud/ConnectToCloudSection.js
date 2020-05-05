import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import React from 'react';

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

	const syncWorkspace = useMethod('cloud:syncWorkspace');
	const registerWorkspace = useMethod('cloud:registerWorkspace');

	const handleRegisterButtonClick = async () => {
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
		}
	};

	return <Box is='section' {...props}>
		<Subtitle>{t('Cloud_registration_required')}</Subtitle>
		<Box withRichContent>
			<p>{t('Cloud_registration_required_description')}</p>
		</Box>
		<ButtonGroup>
			<Button primary onClick={handleRegisterButtonClick}>
				{t('Cloud_registration_requried_link_text')}
			</Button>
		</ButtonGroup>
	</Box>;
}

export default ConnectToCloudSection;
