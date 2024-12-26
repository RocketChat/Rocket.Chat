import { Avatar } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import type { IGame } from './GameCenter';
import {
	ContextualbarTitle,
	ContextualbarHeader,
	ContextualbarBack,
	ContextualbarContent,
	ContextualbarClose,
} from '../../components/Contextualbar';

interface IGameCenterContainerProps {
	handleClose: (e: any) => void;
	handleBack: (e: any) => void;
	game: IGame;
}

const GameCenterContainer = ({ handleClose, handleBack, game }: IGameCenterContainerProps): ReactElement => {
	const { t } = useTranslation();

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
				<iframe title={t('Apps_Game_Center')} style={{ position: 'absolute', width: '95%', height: '80%' }} src={game.url}></iframe>
			</ContextualbarContent>
		</>
	);
};

export default GameCenterContainer;
