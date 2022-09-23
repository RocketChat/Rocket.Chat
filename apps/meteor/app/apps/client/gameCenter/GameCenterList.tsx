import { Avatar, Icon, Table, TableBody, TableCell, TableHead, TableRow } from '@rocket.chat/fuselage';
import type { FC, ReactElement } from 'react';
import React from 'react';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import VerticalBar from '../../../../client/components/VerticalBar';
import { FormSkeleton } from '../../../../client/components/Skeleton';
import type { IGame } from './GameCenter';
import GameCenterInvitePlayersModal from './GameCenterInvitePlayersModal';
import { popover } from '../../../ui-utils/client';

interface IGameCenterListProps {
	handleClose: (e: any) => void;
	handleOpenGame: (game: IGame) => void;
	games?: IGame[];
	isLoading: boolean;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const useReactModal = (Component: FC<any>): ((game: IGame) => void) => {
	const setModal = useSetModal();

	return useMutableCallback((game) => {
		popover.close();

		const handleClose = (): void => {
			setModal(null);
		};

		setModal(() => <Component onClose={handleClose} game={game} />);
	});
};

const GameCenterList = ({ handleClose, handleOpenGame, games, isLoading }: IGameCenterListProps): ReactElement => {
	const t = useTranslation();
	const handleInvitePlayer = useReactModal(GameCenterInvitePlayersModal);

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
										<TableCell></TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{games.map((game, key) => (
										<TableRow key={key} action>
											<TableCell>
												<Avatar onKeyDown={() => handleOpenGame(game)} onClick={() => handleOpenGame(game)} url={game.icon} /> {game.name}
											</TableCell>
											<TableCell onKeyDown={() => handleOpenGame(game)} onClick={() => handleOpenGame(game)}>
												{game.description}
											</TableCell>
											<TableCell>
												<Icon
													onKeyDown={() => handleInvitePlayer(game)}
													onClick={() => handleInvitePlayer(game)}
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
