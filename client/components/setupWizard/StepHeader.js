import { Box, Headline, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { useTranslation } from '../../contexts/TranslationContext';

export function StepHeader({ number, title }) {
	const t = useTranslation();

	return <Margins blockEnd='32'>
		<Box is='header' className='SetupWizard__StepHeader'>
			<Box is='p' textStyle='c1' textColor='hint'>
				{t('Step')} {number}
			</Box>
			<Headline is='h2'>{title}</Headline>
		</Box>
	</Margins>;
}
