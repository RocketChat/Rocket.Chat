import { Sidebar, Box, Icon } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import { ButtonsList } from './hooks/useButtonsLists';

const Header: FC<{
	calls: number;
	state: string;
	buttonList: ButtonsList;
}> = ({ calls, state, buttonList }) => {
	const t = useTranslation();
	const compactHeaderStates = ['incoming', 'current'];
	return (
		<Sidebar.TopBar>
			{compactHeaderStates.includes(state) && (
				<Box mbe={8} textAlign='center' color='surface'>
					{calls} {t('Calls_in_queue', calls)}
				</Box>
			)}
			<Box display='flex' justifyContent='space-between' m='x16'>
				{/* <Sidebar.TopBar.ToolBox> */}
				<Sidebar.TopBar.Title>{t('Phone_call')}</Sidebar.TopBar.Title>
				<Sidebar.TopBar.Actions>{buttonList.buttons}</Sidebar.TopBar.Actions>
				{/* </Sidebar.TopBar.ToolBox> */}
			</Box>
			{!compactHeaderStates.includes(state) && (
				<Box
					mbs={18}
					display='flex'
					justifyContent='space-between'
					alignItems='center'
					color='surface'
					lineHeight={20}
				>
					<Box fontSize={14}>
						<Icon color='info' size={24} name='phone-in' />
						{t('Calls_in_queue')}
					</Box>
					<Box fontSize={22}>{calls}</Box>
				</Box>
			)}
		</Sidebar.TopBar>
	);
};

export default Header;
