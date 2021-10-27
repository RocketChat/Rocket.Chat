import { ButtonGroup, Box } from '@rocket.chat/fuselage';
import React, { FC, ReactNode } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';

const CallToolBox: FC<{
	state: string;
	buttonList: Array<ReactNode>;
}> = ({ buttonList }) => {
	const t = useTranslation();
	return (
		<Box display='flex' mbe={8} alignItems='center' justifyContent='space-between'>
			<Box color='surface'>{t('Phone Call' as 'color')}</Box>
			<ButtonGroup align='end'>{buttonList}</ButtonGroup>
		</Box>
	);
};

export default CallToolBox;
