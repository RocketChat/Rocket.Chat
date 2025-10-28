import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { usePermission, useSetModal, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import ConvertToChannelModal from './ConvertToChannelModal';
import { useEndpointMutation } from '../../../../hooks/useEndpointMutation';

export const useConvertToChannel = ({ _id, teamId }: IRoom) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const userId = useUserId();
	const canEdit = usePermission('edit-team-channel', _id);
	const dispatchToastMessage = useToastMessageDispatch();

	const { mutateAsync: convertTeamToChannel } = useEndpointMutation('POST', '/v1/teams.convertToChannel', {
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('Team_converted_to_channel') });
		},
		onSettled: () => {
			setModal(null);
		},
	});

	const onClickConvertToChannel = useEffectEvent(() => {
		if (!userId || !teamId) {
			throw new Error('Invalid teamId or userId');
		}

		const onConfirm = async (roomsToRemove: { [key: string]: Serialized<IRoom> }) => {
			await convertTeamToChannel({
				teamId,
				roomsToRemove: Object.keys(roomsToRemove),
			});
		};

		setModal(
			<ConvertToChannelModal
				onClose={() => setModal(null)}
				onCancel={() => setModal(null)}
				onConfirm={onConfirm}
				teamId={teamId}
				userId={userId}
			/>,
		);
	});

	return canEdit ? onClickConvertToChannel : undefined;
};
