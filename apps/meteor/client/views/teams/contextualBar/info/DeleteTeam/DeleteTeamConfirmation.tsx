import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../../components/GenericModal';
import RoomLinkList from './RoomLinkList';

type DeleteTeamConfirmationProps = {
	deletedRooms: { [key: string]: Serialized<IRoom> };
	keptRooms: { [key: string]: Serialized<IRoom> };
	onConfirm: (roomsToDelete: IRoom['_id'][]) => void;
	onReturn?: () => void;
	onCancel: () => void;
};

const DeleteTeamConfirmation = ({ deletedRooms, keptRooms, onConfirm, onReturn, onCancel }: DeleteTeamConfirmationProps) => {
	const t = useTranslation();
	const roomIds = Object.values(deletedRooms).map(({ _id }) => _id);

	return (
		<GenericModal
			variant='danger'
			title={t('Delete_roomType', { roomType: 'team' })}
			onConfirm={() => onConfirm(roomIds)}
			onCancel={onReturn}
			confirmText={t('Remove')}
			cancelText={t('Back')}
			onClose={onCancel}
		>
			<p>{t('Delete_roomType_description', { roomType: 'team' })}</p>
			{!!Object.values(deletedRooms).length && (
				<>
					<br />
					<p>
						{t('Teams_deleted_channels')} <RoomLinkList rooms={deletedRooms} />
					</p>
				</>
			)}
			{!!Object.values(keptRooms).length && (
				<>
					<br />
					<p>
						{t('Teams_kept_channels')} <RoomLinkList rooms={keptRooms} />
					</p>
				</>
			)}
		</GenericModal>
	);
};

export default DeleteTeamConfirmation;
