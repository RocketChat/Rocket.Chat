import { Avatar } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import {
	VerticalbarTitle,
	VerticalbarHeader,
	VerticalbarBack,
	VerticalbarContent,
	VerticalbarClose,
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
			<VerticalbarHeader>
				{handleBack && <VerticalbarBack onClick={handleBack} />}
				<VerticalbarTitle>
					<Avatar url={game.icon} /> {game.name}
				</VerticalbarTitle>
				{handleClose && <VerticalbarClose onClick={handleClose} />}
			</VerticalbarHeader>
			<VerticalbarContent pb='x16'>
				<iframe style={{ position: 'absolute', width: '95%', height: '80%' }} src={game.url}></iframe>
			</VerticalbarContent>
		</>
	);
};

export default GameCenterContainer;
