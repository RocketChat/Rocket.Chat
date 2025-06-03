import type { IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useMethod, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { IGame } from './GameCenter';
import GenericModal from '../../components/GenericModal';
import UserAutoCompleteMultipleFederated from '../../components/UserAutoCompleteMultiple/UserAutoCompleteMultipleFederated';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';

type Username = Exclude<IUser['username'], undefined>;

interface IGameCenterInvitePlayersModalProps {
	game: IGame;
	onClose: () => void;
}

const GameCenterInvitePlayersModal = ({ game: { name }, onClose }: IGameCenterInvitePlayersModalProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [users, setUsers] = useState<Array<Username>>([]);

	const createPrivateGroup = useMethod('createPrivateGroup');
	const sendMessage = useMethod('sendMessage');

	const { mutate: sendInvite } = useMutation({
		mutationKey: ['createPrivateGroup', name],
		mutationFn: () => {
			const privateGroupName = `${name.replace(/\s/g, '-')}-${Math.random().toString(16)}`;
			return createPrivateGroup(privateGroupName, users);
		},
		onSuccess: (data) => {
			roomCoordinator.openRouteLink(data.t, data);
		},
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
		onSettled(data) {
			if (!data) {
				onClose();
				return;
			}
			sendMessageMutation(data.rid);
			onClose();
		},
	});

	const { mutate: sendMessageMutation } = useMutation({
		mutationKey: ['sendMessage', name],
		mutationFn: (rid: string) => {
			return sendMessage({
				_id: Math.random().toString(36),
				rid,
				msg: t('Apps_Game_Center_Play_Game_Together', { name }),
			});
		},
		onError: (error) => dispatchToastMessage({ type: 'error', message: error }),
	});

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
