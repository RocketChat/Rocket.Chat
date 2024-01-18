import { Icon, Table, TableBody, TableCell, TableHead, TableRow } from '@rocket.chat/fuselage';
import { Avatar } from '@rocket.chat/ui-avatar';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';

import {
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarContent,
} from '../../../../client/components/Contextualbar';
import { FormSkeleton } from '../../../../client/components/Skeleton';
import type { IGame } from './GameCenter';
import GameCenterInvitePlayersModal from './GameCenterInvitePlayersModal';

interface IGameCenterListProps {
	handleClose: (e: any) => void;
	handleOpenGame: (game: IGame) => void;
	games?: IGame[];
	isLoading: boolean;
}

const GameCenterList = ({ handleClose, handleOpenGame, games, isLoading }: IGameCenterListProps): ReactElement => {
	const t = useTranslation();
	const setModal = useSetModal();
	const handleInvitePlayer = useCallback(
		(game) => {
			const handleClose = (): void => {
				setModal(null);
			};
			setModal(() => <GameCenterInvitePlayersModal onClose={handleClose} game={game} />);
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
