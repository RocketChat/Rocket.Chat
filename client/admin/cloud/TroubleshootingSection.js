import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import Subtitle from '../../components/basic/Subtitle';
import { useMethod } from '../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../contexts/ToastMessagesContext';

const statusPageUrl = 'https://status.rocket.chat';

function TroubleshootingSection({
	onRegisterStatusChange,
	...props
}) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const syncWorkspace = useMethod('cloud:syncWorkspace');

	const handleSyncButtonClick = async () => {
		try {
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
		<Subtitle>{t('Cloud_troubleshooting')}</Subtitle>

		<Box withRichContent>
			<p>{t('Cloud_workspace_support')}</p>
		</Box>

		<ButtonGroup>
			<Button onClick={handleSyncButtonClick}>
				{t('Sync')}
			</Button>
		</ButtonGroup>

		<Box withRichContent>
			<p>
				{t('Cloud_status_page_description')}:{' '}
				<a href={statusPageUrl} target='_blank' rel='noopener noreferrer'>{statusPageUrl}</a>
			</p>
		</Box>
	</Box>;
}

export default TroubleshootingSection;
