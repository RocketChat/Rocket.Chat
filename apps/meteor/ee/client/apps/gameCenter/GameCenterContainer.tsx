import { Avatar } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import {
	ContextualbarTitle,
	ContextualbarHeader,
	ContextualbarBack,
	ContextualbarContent,
	ContextualbarClose,
} from '../../../../client/components/Contextualbar';
import type { IGame } from './GameCenter';

interface IGameCenterContainerProps {
	handleClose: (e: any) => void;
	handleBack: (e: any) => void;
	game: IGame;
}

const GameCenterContainer = ({ handleClose, handleBack, game }: IGameCenterContainerProps): ReactElement => {
	return (
		<>
			<ContextualbarHeader>
				{handleBack && <ContextualbarBack onClick={handleBack} />}
				<ContextualbarTitle>
					<Avatar url={game.icon} /> {game.name}
				</ContextualbarTitle>
				{handleClose && <ContextualbarClose onClick={handleClose} />}
			</ContextualbarHeader>
			<ContextualbarContent pb={16}>
				<iframe style={{ position: 'absolute', width: '95%', height: '80%' }} src={game.url}></iframe>
			</ContextualbarContent>
		</>
	);
};

export default GameCenterContainer;
