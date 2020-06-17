import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';

export function StepHeader({ number, title }) {
	const t = useTranslation();

	return <Box is='header' marginBlockEnd='x32'>
		<Box is='p' fontScale='c1' color='hint'>{t('Step')} {number}</Box>
		<Box is='h2' fontScale='h1' color='default'>{title}</Box>
	</Box>;
}
