import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import ConvertToChannelModal from '../../../../../teams/contextualBar/info/ConvertToChannel';

export const useConvertToChannel = (room: IRoom) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const convertTeamToChannel = useEndpoint('POST', '/v1/teams.convertToChannel');

	const onClickConvertToChannel = useEffectEvent(() => {
		if (!room.teamId) {
			return;
		}

		const onConfirm = async (roomsToRemove: { [key: string]: Serialized<IRoom> }) => {
			if (!room.teamId) {
				return;
			}

			try {
				await convertTeamToChannel({
					teamId: room.teamId,
					roomsToRemove: Object.keys(roomsToRemove),
				});

				dispatchToastMessage({ type: 'success', message: t('Success') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(<ConvertToChannelModal onCancel={() => setModal(null)} onConfirm={onConfirm} teamId={room.teamId} />);
	});

	return room.teamMain ? onClickConvertToChannel : undefined;
};
