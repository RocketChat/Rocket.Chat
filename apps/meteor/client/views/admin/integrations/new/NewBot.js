import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

export default function NewBot() {
	const t = useTranslation();
	return <Box pb={20} fontScale='h4' key='bots' dangerouslySetInnerHTML={{ __html: t('additional_integrations_Bots') }} />;
}
