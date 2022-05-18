import { Grid } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import React, { ReactElement, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { IGame } from '../../../definition/IGame';
import BottomBar from '../../components/BottomBar';
import Page from '../../components/Page';
import PageInlineNavbar from '../../components/PageInlineNavbar/PageInlineNavbar';
import TopBar from '../../topbar/TopBar';
import SingleGame from './SingleGame';

const GamesView = (): ReactElement => {
	const [gamesResults, setGamesResults] = useState([]);
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

	const getGames = (): void => {
		Meteor.call('getGames', { count: 10 }, {}, (error, result) => {
			if (result) {
				if (result.length) {
					setGamesResults(result);
					console.log('Games were fetched');
				} else {
					data.map((game, index) => {
						// The server requires us to wait atleast 2 seconds before sending in a new request.
						if (index > 0) {
							setTimeout(() => {
								Meteor.call(
									'createGame',
									{ title: game.title, description: game.description, ranking: game.ranking, tags: game.tags },
									(error, result) => {
										if (result) {
											console.log('Games were created');
										}
									},
								);
							}, 3000);
						}

						// Refetch the games once its done adding.
						if (index === data.length - 1) {
							getGames();
						}
						return null;
					});
				}
			}
		});
	};
	Meteor.startup(() => {
		if (!gamesResults.length) {
			getGames();
		}
	});
	return (
		<Page flexDirection='row'>
			<Page>
				<TopBar />
				<PageInlineNavbar />
				<Page.Content>
					<Grid style={{ overflowY: 'auto', overflowX: 'hidden' }}>
						{gamesResults.map((item, index) => (
							<Grid.Item xs={4} md={4} lg={6} key={index}>
								<SingleGame {...item} />
							</Grid.Item>
						))}
					</Grid>
				</Page.Content>
				{isMobile ? <BottomBar /> : null}
			</Page>
		</Page>
	);
};

export default GamesView;
