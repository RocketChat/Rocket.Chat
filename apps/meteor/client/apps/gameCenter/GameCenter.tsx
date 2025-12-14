import type { IExternalComponent } from '@rocket.chat/apps-engine/definition/externalComponent';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useState } from 'react';
import type { MouseEvent, ReactElement } from 'react';

import GameCenterContainer from './GameCenterContainer';
import GameCenterList from './GameCenterList';
import { useExternalComponentsQuery } from './hooks/useExternalComponentsQuery';
import { preventSyntheticEvent } from '../../lib/utils/preventSyntheticEvent';

export type IGame = IExternalComponent;

const GameCenter = (): ReactElement => {
	const [openedGame, setOpenedGame] = useState<IGame>();

	const { closeTab } = useRoomToolbox();

	const result = useExternalComponentsQuery();

	const handleClose = useEffectEvent(() => closeTab());

	const handleBack = useEffectEvent((e: MouseEvent) => {
		setOpenedGame(undefined);
		preventSyntheticEvent(e);
	});

	if (!openedGame) {
		return (
			<GameCenterList
				data-testid='game-center-list'
				handleClose={handleClose}
				handleOpenGame={setOpenedGame}
				games={result.data}
				isLoading={result.isPending}
			/>
		);
	}

	return <GameCenterContainer data-testid='game-center-container' handleBack={handleBack} handleClose={handleClose} game={openedGame} />;
};

export default GameCenter;
