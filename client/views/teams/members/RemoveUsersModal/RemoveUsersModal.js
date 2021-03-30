import React, { useState } from 'react';
import { Box, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../contexts/TranslationContext';
import GenericModal from '../../../../components/GenericModal';
import ChannelDesertionTable from '../../ChannelDesertionTable';
import RoomLinkList from './RoomLinkList';

const STEPS = {
	LIST_ROOMS: 'LIST_ROOMS',
	CONFIRM_DELETE: 'CONFIRM_DELETE',
};

const RemoveUsersFirstStep = ({
	onClose,
	onCancel,
	onConfirm,
	username,
	results,
	rooms,
	// params,
	// onChangeParams,
	onToggleAllRooms,
	onChangeRoomSelection,
	selectedRooms,
	// onChangeParams={(...args) => console.log(args)}
	eligibleRoomsLength,
	...props
}) => {
	const t = useTranslation();

	return <GenericModal
		variant='warning'
		icon='warning'
		title={t('What would you like to do?')}
		cancelText={t('Cancel')}
		confirmText={t('Continue')}
		onClose={onClose}
		onCancel={onCancel}
		onConfirm={onConfirm}
		{...props}
	>
		<Box mbe='x24' fontScale='p1'>{t('Select_the_channels_you_want_the_user_to_be_removed_from')}</Box>
		<ChannelDesertionTable
			lastOwnerWarning={t('Teams_channels_last_owner_leave_channel_warning')}
			onToggleAllRooms={onToggleAllRooms}
			rooms={rooms}
			params={{}}
			onChangeParams={() => {}}
			onChangeRoomSelection={onChangeRoomSelection}
			selectedRooms={selectedRooms}
			eligibleRoomsLength={eligibleRoomsLength}
		/>
	</GenericModal>;
};

export const RemoveUsersSecondStep = ({
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

	return <GenericModal
		variant='danger'
		cancelText={rooms?.length > 0 ? t('Back') : t('Cancel')}
		confirmText={t('Remove')}
		icon='info'
		title={t('Confirmation')}
		onClose={onClose}
		onCancel={onCancel}
		onConfirm={() => onConfirm(deletedRooms)}
		{...props}>
		<Margins blockEnd='x16'>
			{rooms.length === 0 && <div>{t('Teams_removing__username__from_team', { username })}</div>}
			{rooms.length > 0 && (Object.values(keptRooms).length > 0
				? <div>{t('Teams_kept__username__channels', { username })} <RoomLinkList rooms={keptRooms} /></div>
				: <div>{t('Teams_removing__username__from_team_and_channels', { username })}</div>)}
		</Margins>
	</GenericModal>;
};

const RemoveUsersModal = ({
	onClose,
	onCancel,
	onConfirm,
	rooms,
	currentStep = rooms?.length > 0 ? STEPS.LIST_ROOMS : STEPS.CONFIRM_DELETE,
	username,
}) => {
	const [step, setStep] = useState(currentStep);

	const [deletedRooms, setDeletedRooms] = useState({});
	const [keptRooms, setKeptRooms] = useState({});

	const onContinue = useMutableCallback(() => setStep(STEPS.CONFIRM_DELETE));
	const onReturn = useMutableCallback(() => setStep(STEPS.LIST_ROOMS));

	const onChangeRoomSelection = useMutableCallback((room) => {
		if (deletedRooms[room._id]) {
			setDeletedRooms((deletedRooms) => ({ ...deletedRooms, [room._id]: undefined }));
			return;
		}
		setDeletedRooms((deletedRooms) => ({ ...deletedRooms, [room._id]: room }));
	});

	const onToggleAllRooms = useMutableCallback(() => {
		if (Object.values(deletedRooms).filter(Boolean).length === 0) {
			return setDeletedRooms(Object.fromEntries(rooms.map((room) => [room._id, room])));
		}
		setDeletedRooms({});
	});

	const onSelectRooms = useMutableCallback(() => {
		const keptRooms = Object.fromEntries(rooms.filter((room) => !deletedRooms[room._id]).map((room) => [room._id, room]));
		setKeptRooms(keptRooms);
		onContinue();
	});

	if (step === STEPS.CONFIRM_DELETE) {
		return <RemoveUsersSecondStep
			onConfirm={onConfirm}
			onClose={onClose}
			onCancel={rooms?.length > 0 ? onReturn : onCancel}
			deletedRooms={deletedRooms}
			rooms={rooms}
			keptRooms={keptRooms}
			username={username}
		/>;
	}

	return <RemoveUsersFirstStep
		onConfirm={onSelectRooms}
		onClose={onClose}
		onCancel={onCancel}
		rooms={rooms}
		params={{}}
		selectedRooms={deletedRooms}
		onToggleAllRooms={onToggleAllRooms}
		// onChangeParams={(...args) => console.log(args)}
		onChangeRoomSelection={onChangeRoomSelection}
		eligibleRoomsLength={rooms?.length}
	/>;
};

export default RemoveUsersModal;
