import { States, StatesIcon, StatesTitle, StatesSubtitle, Box, StatesActions, StatesAction } from '@rocket.chat/fuselage';
import { useLayout, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import BurgerMenu from '../../components/BurgerMenu';
import TemplateHeader from '../../components/Header';
import RoomLayout from './layout/RoomLayout';

const RoomNotFound = (): ReactElement => {
	const { isMobile } = useLayout();
	const t = useTranslation();
	const homeRoute = useRoute('home');

	const handleGoHomeClick = (): void => {
		homeRoute.push();
	};

	return (
		<RoomLayout
			header={
				isMobile && (
					<TemplateHeader justifyContent='start'>
						<TemplateHeader.ToolBox>
							<BurgerMenu />
						</TemplateHeader.ToolBox>
					</TemplateHeader>
				)
			}
			body={
				<Box display='flex' justifyContent='center' height='full'>
					<States>
						<StatesIcon name='magnifier' />
						<StatesTitle>{t('Room_not_found')}</StatesTitle>
						<StatesSubtitle>{t('Room_not_exist_or_not_permission')}</StatesSubtitle>
						<StatesActions mbs='x16'>
							<StatesAction onClick={handleGoHomeClick}>{t('Homepage')}</StatesAction>
						</StatesActions>
					</States>
				</Box>
			}
		/>
	);
};

export default RoomNotFound;
