import { Box } from '@rocket.chat/fuselage';
import React from 'react';
import { useTranslation } from 'react-i18next';

const NewBot = () => {
	const { t } = useTranslation();

	return <Box pb={20} fontScale='h4' key='bots' dangerouslySetInnerHTML={{ __html: t('additional_integrations_Bots') }} />;
};

export default NewBot;
