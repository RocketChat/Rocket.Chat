import React, { ReactElement } from 'react';

import SingleGame from './SingleGame';
import Page from '../../components/Page';
import BottomBar from '../../components/BottomBar';
import TopBar from '../../topbar/TopBar';
import { IGame } from '../../../definition/IGame';
import PageInlineNavbar from '../../components/PageInlineNavbar/PageInlineNavbar';
import { Grid, Button, Icon } from '@rocket.chat/fuselage';

const GamesView = (): ReactElement => {
	const data: IGame[] = [
		{
			_id: 'firstgame',
			_updatedAt: new Date(),
			createdAt: new Date(),
			title: 'Super Mario',
			description: 'Super Mario is a 2D and 3D platform game series created by Nintendo based on and starring the fictional plumber Mario',
			ranking: 3,
			tags: ['2D', '3D'],
		},
		{
			_id: 'secondGame',
			_updatedAt: new Date(),
			createdAt: new Date(),
			title: 'Minecraft',
			description: 'Minecraft is a sandbox video game developed by Mojang Studios',
			ranking: 2,
			tags: ['3D'],
		},
		{
			_id: 'thirdGame',
			_updatedAt: new Date(),
			createdAt: new Date(),
			title: 'Fortnite',
			description: 'Fortnite is an online video game developed by Epic Games and released in 2017',
			ranking: 1,
			tags: ['3D', 'online'],
		},
	];
	return (
		<Page flexDirection='row'>
			<Page>
				<TopBar />
				<PageInlineNavbar />
				<Page.Content>
					<Grid style={{ overflowY: 'auto', overflowX: 'hidden' }}>
						{data.map((item, index) => (
							<SingleGame key={index} {...item} />
						))}
					</Grid>
				</Page.Content>
				<BottomBar />
			</Page>
		</Page>
	);
};

export default GamesView;
