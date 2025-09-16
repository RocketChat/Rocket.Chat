import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useRouter, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import LeaveTeam from './LeaveTeam';
import { useEndpointMutation } from '../../../../hooks/useEndpointMutation';

export const useLeaveTeam = ({ teamId }: IRoom) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const router = useRouter();

	const { mutateAsync: leaveTeam } = useEndpointMutation('POST', '/v1/teams.leave', {
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Teams_left_team_successfully') });
			router.navigate('/home');
		},
		onSettled: () => {
			setModal(null);
		},
	});

	// const canLeave = usePermission('leave-team'); /* && room.cl !== false && joined */
	const handleLeaveTeam = useEffectEvent(() => {
		if (!teamId) {
			throw new Error('Invalid teamId');
		}

		const onConfirm = async (selectedRooms: { [key: string]: Serialized<IRoom> & { isLastOwner?: boolean } } = {}) => {
			const roomsLeft = Object.keys(selectedRooms);
			const roomsToLeave = Array.isArray(roomsLeft) && roomsLeft.length > 0 ? roomsLeft : [];

			await leaveTeam({
				teamId,
				...(roomsToLeave.length && { rooms: roomsToLeave }),
			});
		};

		setModal(<LeaveTeam onConfirm={onConfirm} onCancel={() => setModal(null)} teamId={teamId} />);
	});

	return handleLeaveTeam;
};
