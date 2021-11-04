import { ButtonGroup, Box } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { ButtonsList } from './hooks/useButtonsLists';

const CallToolBox: FC<{
	state: string;
	buttonList: ButtonsList;
}> = ({ buttonList }) => {
	const t = useTranslation();
	return (
		<Box display='flex' mbe={8} alignItems='center' justifyContent='space-between'>
			<Box color='surface'>{t('Phone_call')}</Box>
			<ButtonGroup align='end'>{buttonList.buttons}</ButtonGroup>
		</Box>
	);
};

export default CallToolBox;
