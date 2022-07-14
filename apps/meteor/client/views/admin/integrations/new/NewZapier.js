import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

export default function NewZapier() {
	const t = useTranslation();
	return <Box pb='x20' fontScale='h4' key='zapier' dangerouslySetInnerHTML={{ __html: t('additional_integrations_Zapier') }} />;
}
