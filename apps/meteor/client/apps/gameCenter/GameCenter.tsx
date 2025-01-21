import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useState } from 'react';
import type { MouseEvent, ReactElement } from 'react';

import GameCenterContainer from './GameCenterContainer';
import GameCenterList from './GameCenterList';
import { useExternalComponentsQuery } from './hooks/useExternalComponentsQuery';
import { preventSyntheticEvent } from '../../lib/utils/preventSyntheticEvent';
import { useRoomToolbox } from '../../views/room/contexts/RoomToolboxContext';

export type IGame = IExternalComponent;

const GameCenter = (): ReactElement => {
	const [openedGame, setOpenedGame] = useState<IGame>();

	const { closeTab } = useRoomToolbox();

	const result = useExternalComponentsQuery();

	const handleClose = useEffectEvent((e: MouseEvent) => {
		preventSyntheticEvent(e);
		closeTab();
	});

	const handleBack = useEffectEvent((e: MouseEvent) => {
		setOpenedGame(undefined);
		preventSyntheticEvent(e);
	});

	return (
		<>
			{!openedGame && (
				<GameCenterList
					data-testid='game-center-list'
					handleClose={handleClose}
					handleOpenGame={setOpenedGame}
					games={result.data}
					isLoading={result.isPending}
				/>
			)}

			{openedGame && (
				<GameCenterContainer data-testid='game-center-container' handleBack={handleBack} handleClose={handleClose} game={openedGame} />
			)}
		</>
	);
};

export default GameCenter;
