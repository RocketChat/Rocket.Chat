import { Box } from '@rocket.chat/fuselage';
import { Header as TemplateHeader } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import BurgerMenu from '../../components/BurgerMenu';
import NotFoundState from '../../components/NotFoundState';
import RoomLayout from './layout/RoomLayout';

const RoomNotFound = (): ReactElement => {
	const { isMobile } = useLayout();

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
					<NotFoundState title='Room_not_found' subtitle='Room_not_exist_or_not_permission' />
				</Box>
			}
		/>
	);
};

export default RoomNotFound;
