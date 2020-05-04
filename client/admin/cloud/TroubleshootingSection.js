import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import Subtitle from '../../components/basic/Subtitle';

const statusPageUrl = 'https://status.rocket.chat';

function TroubleshootingSection({
	onSyncButtonClick,
	...props
}) {
	const t = useTranslation();

	return <Box is='section' {...props}>
		<Subtitle>{t('Cloud_troubleshooting')}</Subtitle>

		<Box withRichContent>
			<p>{t('Cloud_workspace_support')}</p>
		</Box>

		<ButtonGroup>
			<Button onClick={onSyncButtonClick}>
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
