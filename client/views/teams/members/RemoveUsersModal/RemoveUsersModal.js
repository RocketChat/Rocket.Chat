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
	lastOwnerRooms,
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
		{...props}><>
			<Box mbe='x24' fontScale='p1'>{t('Select_the_channels_you_want_the_user_to_be_removed_from')}</Box>
			<ChannelDesertionTable
				lastOwnerWarning={t('Teams_channels_last_owner_leave_channel_warning')}
				onToggleAllRooms={onToggleAllRooms}
				lastOwnerRooms={lastOwnerRooms}
				rooms={rooms}
				params={{}}
				onChangeParams={() => {}}
				onChangeRoomSelection={onChangeRoomSelection}
				selectedRooms={selectedRooms}
				eligibleRoomsLength={eligibleRoomsLength}
			/>
		</>
	</GenericModal>;
};

const RemoveUsersSecondStep = ({
	onClose,
	onCancel,
	onConfirm,
	deletedRooms,
	keptRooms,
	username,
	rooms,
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
			{/* {(Object.values(deletedRooms).length > 0 || Object.values(keptRooms).length > 0) && <Box>{ username } is the last owner of some Channels, once removed from the Team, the Channel will be kept inside the Team but the member will still be responsible for managing the Channel from outside the Team.</Box>} */}

			{/* {Object.values(deletedRooms).length > 0 && <Box>{ username } is not going to be removed from the following Channels: <RoomLinkList rooms={deletedRooms} /> </Box>} */}

			{Object.values(keptRooms).length > 0 ? <Box>{t('Teams_kept_username_channels', { username })} <RoomLinkList rooms={keptRooms} /></Box> : <Box>{t('Teams_removing_user_from_team_and_channels', { username })}</Box>}
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
