import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';

export default function NewBot() {
	const t = useTranslation();
	return <Box pb='x20' fontScale='s1' key='bots' dangerouslySetInnerHTML={{ __html: t('additional_integrations_Bots') }}/>;
}
