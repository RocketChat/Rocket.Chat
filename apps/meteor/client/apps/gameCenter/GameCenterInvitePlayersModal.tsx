import type { IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { Random } from '@rocket.chat/random';
import { GenericModal } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { IGame } from './GameCenter';
import { sdk } from '../../../app/utils/client/lib/SDKClient';
import UserAutoCompleteMultiple from '../../components/UserAutoCompleteMultiple';
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
			const { group } = await sdk.rest.post('/v1/groups.create', { name: privateGroupName, members: users });

			roomCoordinator.openRouteLink(group.t, { rid: group._id, name: group.name });

			if (openedRoom === group._id) {
				await callWithErrorHandling('sendMessage', {
					_id: Random.id(),
					rid: group._id,
					msg: t('Apps_Game_Center_Play_Game_Together', { name }),
				});
			}
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
					<UserAutoCompleteMultiple value={users} onChange={setUsers} federated />
				</Box>
			</GenericModal>
		</>
	);
};

export default GameCenterInvitePlayersModal;
