import { Avatar, Icon, Table, TableBody, TableCell, TableHead, TableRow } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { IGame } from './GameCenter';
import GameCenterInvitePlayersModal from './GameCenterInvitePlayersModal';
import { ContextualbarHeader, ContextualbarTitle, ContextualbarClose, ContextualbarContent } from '../../components/Contextualbar';
import { FormSkeleton } from '../../components/Skeleton';

interface IGameCenterListProps {
	handleClose: (e: any) => void;
	handleOpenGame: (game: IGame) => void;
	games?: IGame[];
	isLoading: boolean;
}

const GameCenterList = ({ handleClose, handleOpenGame, games, isLoading }: IGameCenterListProps): ReactElement => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const handleInvitePlayer = useCallback(
		(game: IGame) => {
			const handleClose = (): void => {
				setModal(null);
			};
			setModal(<GameCenterInvitePlayersModal onClose={handleClose} game={game} />);
		},
		[setModal],
	);

	return (
		<div>
			<ContextualbarHeader>
				<ContextualbarTitle>{t('Apps_Game_Center')}</ContextualbarTitle>
				{handleClose && <ContextualbarClose onClick={handleClose} />}
			</ContextualbarHeader>
			{!isLoading && (
				<ContextualbarContent>
					{games && (
						<div>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>{t('Name')}</TableCell>
										<TableCell>{t('Description')}</TableCell>
										<TableCell></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{games.map((game, key) => (
										<TableRow key={key} action onKeyDown={() => handleOpenGame(game)} onClick={() => handleOpenGame(game)}>
											<TableCell>
												<Avatar url={game.icon} /> {game.name}
											</TableCell>
											<TableCell>{game.description}</TableCell>
											<TableCell>
												<Icon
													onKeyDown={(e) => {
														e.stopPropagation();
														handleInvitePlayer(game);
													}}
													onClick={(e) => {
														e.stopPropagation();
														handleInvitePlayer(game);
													}}
													name='plus'
													title={t('Apps_Game_Center_Invite_Friends')}
												></Icon>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</ContextualbarContent>
			)}

			{isLoading && (
				<ContextualbarContent>
					<FormSkeleton />
				</ContextualbarContent>
			)}
		</div>
	);
};

export default GameCenterList;
