import { Box, Button, ButtonGroup } from '@rocket.chat/fuselage';
import React from 'react';

import Subtitle from '../../components/basic/Subtitle';
import { useTranslation } from '../../contexts/TranslationContext';

function ConnectToCloudSection({
	onRegisterButtonClick,
	...props
}) {
	const t = useTranslation();

	return <Box is='section' {...props}>
		<Subtitle>{t('Cloud_registration_required')}</Subtitle>
		<Box withRichContent>
			<p>{t('Cloud_registration_required_description')}</p>
		</Box>
		<ButtonGroup>
			<Button primary onClick={onRegisterButtonClick}>
				{t('Cloud_registration_requried_link_text')}
			</Button>
		</ButtonGroup>
	</Box>;
}

export default ConnectToCloudSection;
