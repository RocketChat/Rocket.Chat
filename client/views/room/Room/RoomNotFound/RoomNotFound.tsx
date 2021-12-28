import { States, StatesIcon, StatesTitle, StatesSubtitle, Box } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React, { ReactElement } from 'react';

import { IRoom } from '../../../../../definition/IRoom';
import BurgerMenu from '../../../../components/BurgerMenu';
import TemplateHeader from '../../../../components/Header';
import { useLayout } from '../../../../contexts/LayoutContext';
import { useSession } from '../../../../contexts/SessionContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { RoomTemplate } from '../../components/RoomTemplate/RoomTemplate';

type RoomNotFoundSession = {
	type: IRoom['t'];
	name: IRoom['name'];
	error: Meteor.Error;
};

const RoomNotFound = (): ReactElement => {
	const { isMobile } = useLayout();
	const t = useTranslation();
	const { name, type } = useSession('roomNotFound') as RoomNotFoundSession;

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
						<StatesIcon name='emoji-neutral' />
						<StatesTitle>{t('Name_not_found', { name })}</StatesTitle>
						<StatesSubtitle>
							{type === 'd'
								? t('User_not_exist_or_not_permission')
								: t('Room_not_exist_or_not_permission')}
						</StatesSubtitle>
					</States>
				</Box>
			</RoomTemplate.Body>
		</RoomTemplate>
	);
};

export default RoomNotFound;
