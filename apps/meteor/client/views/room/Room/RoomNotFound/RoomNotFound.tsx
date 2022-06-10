import { States, StatesIcon, StatesTitle, StatesSubtitle, Box } from '@rocket.chat/fuselage';
import { useLayout, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import BurgerMenu from '../../../../components/BurgerMenu';
import TemplateHeader from '../../../../components/Header';
import { RoomTemplate } from '../../components/RoomTemplate/RoomTemplate';

const RoomNotFound = (): ReactElement => {
	const { isMobile } = useLayout();
	const t = useTranslation();

	return (
		<RoomTemplate>
			<RoomTemplate.Header>
				{isMobile && (
					<TemplateHeader justifyContent='start'>
						<TemplateHeader.ToolBox>
							<BurgerMenu />
						</TemplateHeader.ToolBox>
					</TemplateHeader>
				)}
			</RoomTemplate.Header>
			<RoomTemplate.Body>
				<Box display='flex' justifyContent='center' height='full'>
					<States>
						<StatesIcon name='magnifier' />
						<StatesTitle>{t('Room_not_found')}</StatesTitle>
						<StatesSubtitle>{t('Room_not_exist_or_not_permission')}</StatesSubtitle>
					</States>
				</Box>
			</RoomTemplate.Body>
		</RoomTemplate>
	);
};

export default RoomNotFound;
