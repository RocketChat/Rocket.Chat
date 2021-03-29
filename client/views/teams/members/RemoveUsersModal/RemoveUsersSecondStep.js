import { Margins } from '@rocket.chat/fuselage';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import { useTranslation } from '../../../../contexts/TranslationContext';
import RoomLinkList from './RoomLinkList';

const RemoveUsersSecondStep = ({
	onClose,
	onCancel,
	onConfirm,
	deletedRooms = {},
	keptRooms = {},
	username,
	rooms = [],
	...props
}) => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='danger'
			cancelText={rooms?.length > 0 ? t('Back') : t('Cancel')}
			confirmText={t('Remove')}
			icon='info'
			title={t('Confirmation')}
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={() => onConfirm(deletedRooms)}
			{...props}
		>
			<Margins blockEnd='x16'>
				{rooms.length === 0 && <div>{t('Teams_removing__username__from_team', { username })}</div>}
				{rooms.length > 0 &&
					(Object.values(keptRooms).length > 0 ? (
						<div>
							{t('Teams_kept__username__channels', { username })} <RoomLinkList rooms={keptRooms} />
						</div>
					) : (
						<div>{t('Teams_removing__username__from_team_and_channels', { username })}</div>
					))}
			</Margins>
		</GenericModal>
	);
};

export default RemoveUsersSecondStep;
