import { useLayout } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import BurgerMenu from '../../../../components/BurgerMenu';
import TemplateHeader from '../../../../components/Header';
import NotFoundState from '../../../../components/NotFoundState';
import { RoomTemplate } from '../../components/RoomTemplate/RoomTemplate';

const RoomNotFound = (): ReactElement => {
	const { isMobile } = useLayout();

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
				<NotFoundState title='Room_not_found' subtitle='Room_not_exist_or_not_permission' />
			</RoomTemplate.Body>
		</RoomTemplate>
	);
};

export default RoomNotFound;
