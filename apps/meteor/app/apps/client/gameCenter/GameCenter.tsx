import React, { useState } from 'react';
import type { ReactElement, SyntheticEvent } from 'react';
import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import GameCenterContainer from './GameCenterContainer';
import GameCenterList from './GameCenterList';
import { useExternalComponentsQuery } from './hooks/useExternalComponentsQuery';
import { useTabBarClose } from '../../../../client/views/room/contexts/ToolboxContext';

export type IGame = IExternalComponent;

const prevent = (e: SyntheticEvent): void => {
	if (e) {
		(e.nativeEvent || e).stopImmediatePropagation();
		e.stopPropagation();
		e.preventDefault();
	}
};

const GameCenter = (): ReactElement => {
	const [openedGame, setOpenedGame] = useState<IGame>();

	const closeTabBar = useTabBarClose();

	const result = useExternalComponentsQuery();

	const handleClose = useMutableCallback((e) => {
		prevent(e);
		closeTabBar();
	});

	const handleBack = useMutableCallback((e) => {
		setOpenedGame(undefined);
		prevent(e);
	});

	return (
		<>
			{!openedGame && (
				<GameCenterList
					data-testid='game-center-list'
					handleClose={handleClose}
					handleOpenGame={setOpenedGame}
					games={result.data}
					isLoading={result.isLoading}
				/>
			)}

			{openedGame && (
				<GameCenterContainer data-testid='game-center-container' handleBack={handleBack} handleClose={handleClose} game={openedGame} />
			)}
		</>
	);
};

export default GameCenter;
