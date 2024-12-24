import type { IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { IGame } from './GameCenter';
import GenericModal from '../../components/GenericModal';
import UserAutoCompleteMultipleFederated from '../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';
import { useOpenedRoom } from '../../lib/RoomManager';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { callWithErrorHandling } from '../../lib/utils/callWithErrorHandling';

type Username = Exclude<IUser['username'], undefined>;

interface IGameCenterInvitePlayersModalProps {
	game: IGame;
	onClose: () => void;
}

const GameCenterInvitePlayersModal = ({ game, onClose }: IGameCenterInvitePlayersModalProps): ReactElement => {
	const { t } = useTranslation();
	const [users, setUsers] = useState<Array<Username>>([]);
	const { name } = game;

	const openedRoom = useOpenedRoom();

	const sendInvite = async () => {
		const privateGroupName = `${name.replace(/\s/g, '-')}-${Random.id(10)}`;

		try {
			const result = await callWithErrorHandling('createPrivateGroup' as any, privateGroupName, users);

			roomCoordinator.openRouteLink(result.t, result);

			Tracker.autorun((c) => {
				if (openedRoom !== result.rid) {
					return;
				}

				callWithErrorHandling('sendMessage', {
					_id: Random.id(),
					rid: result.rid,
					msg: t('Apps_Game_Center_Play_Game_Together', { name }),
				});

				c.stop();
			});
			onClose();
		} catch (err) {
			console.warn(err);
		}
	};

	return (
		<>
			<GenericModal onClose={onClose} onCancel={onClose} onConfirm={sendInvite} title={t('Apps_Game_Center_Invite_Friends')}>
				<Box mbe={16}>{t('Invite_Users')}</Box>
				<Box mbe={16} display='flex' justifyContent='stretch'>
					<UserAutoCompleteMultipleFederated value={users} onChange={setUsers} />
				</Box>
			</GenericModal>
		</>
	);
};

export default GameCenterInvitePlayersModal;
