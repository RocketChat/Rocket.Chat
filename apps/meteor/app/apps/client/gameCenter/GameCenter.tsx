import React, { useEffect, useState } from 'react';
import type { ReactElement, SyntheticEvent } from 'react';
import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import { useMutableCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import { useEndpoint } from '@rocket.chat/ui-contexts';

import { useTabBarClose } from '../../../../client/views/room/providers/ToolboxProvider';
import GameCenterContainer from './GameCenterContainer';
import GameCenterList from './GameCenterList';

export type IGame = IExternalComponent;

const GameCenter = (): ReactElement => {
	const [games, setGames] = useState<IGame[]>();
	const [isOpened, setIsOpened] = useState<boolean>(false);
	const [openedGame, setOpenedGame] = useState<IGame>();
	const [isLoading, setLoading] = useSafely(useState(false));

	const closeTabBar = useTabBarClose();
	const prevent = (e: SyntheticEvent): void => {
		if (e) {
			(e.nativeEvent || e).stopImmediatePropagation();
			e.stopPropagation();
			e.preventDefault();
		}
	};

	const getGamesEndpoint = useEndpoint('GET', '/apps/externalComponents');

	useEffect(() => {
		async function getGames() {
			const { externalComponents } = await getGamesEndpoint();
			setGames(externalComponents);
		}

		if (!games) {
			setLoading(true);
			getGames();
			setLoading(false);
		}
	}, [games, getGamesEndpoint, setLoading]);

	const handleClose = useMutableCallback((e) => {
		prevent(e);
		setIsOpened(false);
		closeTabBar();
	});

	const handleBack = useMutableCallback((e) => {
		prevent(e);
		setIsOpened(false);
		setGames(undefined);
	});

	const handleOpenGame = (isOpened: boolean, game: IGame) => {
		setIsOpened(isOpened);
		setOpenedGame(game);
	};

	return (
		<>
			{!isOpened && (
				<GameCenterList
					data-testid='game-center-list'
					handleClose={handleClose}
					handleOpenGame={handleOpenGame}
					games={games}
					isLoading={isLoading}
				/>
			)}

			{isOpened && openedGame && (
				<GameCenterContainer data-testid='game-center-container' handleBack={handleBack} handleClose={handleClose} game={openedGame} />
			)}
		</>
	);
};

export default GameCenter;
