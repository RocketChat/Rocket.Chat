import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { usePermission, useSetModal, useToastMessageDispatch, useUserId } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

import ConvertToChannelModal from './ConvertToChannelModal';
import { useEndpointAction } from '../../../../hooks/useEndpointAction';

export const useConvertToChannel = (room: IRoom) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const userId = useUserId();
	const canEdit = usePermission('edit-team-channel', room._id);
	const dispatchToastMessage = useToastMessageDispatch();

	const convertTeamToChannel = useEndpointAction('POST', '/v1/teams.convertToChannel');

	const onClickConvertToChannel = useEffectEvent(() => {
		const onConfirm = async (roomsToRemove: { [key: string]: Serialized<IRoom> }) => {
			try {
				await convertTeamToChannel({
					teamId: room.teamId!,
					roomsToRemove: Object.keys(roomsToRemove),
				});

				dispatchToastMessage({ type: 'success', message: t('Success') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(
			<ConvertToChannelModal
				onClose={() => setModal(null)}
				onCancel={() => setModal(null)}
				onConfirm={onConfirm}
				teamId={room.teamId!}
				userId={userId!}
			/>,
		);
	});

	return canEdit ? onClickConvertToChannel : undefined;
};
