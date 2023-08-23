import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';
import type { ReactElement, SyntheticEvent } from 'react';

import { useRoomToolbox } from '../../../../client/views/room/contexts/RoomToolboxContext';
import GameCenterContainer from './GameCenterContainer';
import GameCenterList from './GameCenterList';
import { useExternalComponentsQuery } from './hooks/useExternalComponentsQuery';

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

	const { closeTab } = useRoomToolbox();

	const result = useExternalComponentsQuery();

	const handleClose = useMutableCallback((e) => {
		prevent(e);
		closeTab();
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
