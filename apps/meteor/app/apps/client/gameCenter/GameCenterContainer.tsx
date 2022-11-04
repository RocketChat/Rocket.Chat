import type { ReactElement } from 'react';
import React from 'react';
import { Avatar } from '@rocket.chat/fuselage';

import VerticalBar from '../../../../client/components/VerticalBar';
import type { IGame } from './GameCenter';

interface IGameCenterContainerProps {
	handleClose: (e: any) => void;
	handleBack: (e: any) => void;
	game: IGame;
}

const GameCenterContainer = ({ handleClose, handleBack, game }: IGameCenterContainerProps): ReactElement => {
	return (
		<>
			<VerticalBar.Header>
				{handleBack && <VerticalBar.Back onClick={handleBack} />}
				<VerticalBar.Text>
					<Avatar url={game.icon} /> {game.name}
				</VerticalBar.Text>
				{handleClose && <VerticalBar.Close onClick={handleClose} />}
			</VerticalBar.Header>

			<VerticalBar.Content pb='x16'>
				<iframe style={{ position: 'absolute', width: '95%', height: '80%' }} src={game.url}></iframe>
			</VerticalBar.Content>
		</>
	);
};

export default GameCenterContainer;
