import { Avatar, Table, TableBody, TableCell, TableHead, TableRow } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from '@rocket.chat/ui-contexts';

import VerticalBar from '../../../../client/components/VerticalBar';
import { FormSkeleton } from '../../../../client/components/Skeleton';
import type { IGame } from './GameCenter';

interface IGameCenterListProps {
	handleClose: (e: any) => void;
	handleOpenGame: (isOpened: boolean, game: IGame) => void;
	games?: IGame[];
	isLoading: boolean;
}

const GameCenterList = ({ handleClose, handleOpenGame, games, isLoading }: IGameCenterListProps): ReactElement => {
	const t = useTranslation();

	return (
		<div>
			<VerticalBar.Header>
				<VerticalBar.Text>{t('Apps_Game_Center')}</VerticalBar.Text>
				{handleClose && <VerticalBar.Close onClick={handleClose} />}
			</VerticalBar.Header>

			{!isLoading && (
				<VerticalBar.Content>
					{games && (
						<div>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>{t('Name')}</TableCell>
										<TableCell>{t('Description')}</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{games.map((game, key) => (
										<TableRow onKeyDown={() => handleOpenGame(true, game)} onClick={() => handleOpenGame(true, game)} key={key} action>
											<TableCell>
												<Avatar url={game.icon} /> {game.name}
											</TableCell>
											<TableCell>{game.description}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</VerticalBar.Content>
			)}

			{isLoading && (
				<VerticalBar.Content>
					<FormSkeleton />
				</VerticalBar.Content>
			)}
		</div>
	);
};

export default GameCenterList;
