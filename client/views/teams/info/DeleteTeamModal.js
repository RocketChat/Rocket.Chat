import React, { useState } from 'react';
import { Box, CheckBox, Table, Icon, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import GenericModal from '../../../components/GenericModal';
import GenericTable from '../../../components/GenericTable';
import { useRoomIcon } from '../../../hooks/useRoomIcon';
import { useTranslation } from '../../../contexts/TranslationContext';
import { roomTypes } from '../../../../app/utils';

export const StepOne = ({ onConfirm, onCancel }) => {
	const t = useTranslation();
	return <GenericModal
		variant='warning'
		confirmText={t('Continue')}
		onConfirm={onConfirm}
		onCancel={onCancel}
		onClose={onCancel}
		onClose={onCancel}
	>
		<Box withRichContent>{t('Teams_delete_team_warning')}</Box>
	</GenericModal>;
};

const ChannelRow = ({ onChange, ...room }) => {
	const { rid, name, fname, usersCount } = room;

	const handleChange = useMutableCallback(() => onChange(rid));

	return <Table.Row action>
		<Table.Cell maxWidth='x300' withTruncatedText >
			<CheckBox checked={false} onChange={handleChange} disabled={false} />
			<Margins inline='x8'>
				<Icon size='x16' {...useRoomIcon(room)} />
				{fname ?? name}
			</Margins>
		</Table.Cell>

		<Table.Cell align='end' withTruncatedText>
			{usersCount}
		</Table.Cell>
	</Table.Row>;
};

const ChannelSelectionTable = ({ rooms, params, onChangeParams }) => {
	const t = useTranslation();

	return <Box display='flex' flexDirection='column' height='30vh' mbs='x24'>
		<GenericTable
			header={<>
				<GenericTable.HeaderCell key='name' sort='name'>
					<CheckBox checked={false} disabled={false} />
					<Box mi='x8'>{t('Channel_name')}</Box>
				</GenericTable.HeaderCell>
				<GenericTable.HeaderCell key='usersCount' sort='usersCount'>
					<Box width='100%' textAlign='end'>{t('Members')}</Box>
				</GenericTable.HeaderCell>
			</>}
			results={rooms}
			params={params}
			setParams={onChangeParams}
			fixed={false}
			pagination={false}
		>
			{(room) => <ChannelRow {...room}/>}
		</GenericTable>
	</Box>;
};

export const StepTwo = ({ rooms, params, onChangeParams, onChangeSelected, selected, onConfirm, onCancel }) => {
	const t = useTranslation();

	return <GenericModal
		variant='warning'
		title={t('Teams_about_the_channels')}
		onConfirm={onConfirm}
		onCancel={onCancel}
		onClose={onCancel}
		confirmText={t('Continue')}
	>
		{t('Teams_delete_team_choose_channels')}
		<ChannelSelectionTable
			rooms={rooms}
			params={{}}
			onChangeParams={() => {}}
			onChangeSelected={onChangeSelected}
			selected={selected}
		/>
	</GenericModal>;
};

const RoomList = ({ rooms }) => rooms.map((room, i) => <>
	<a href={roomTypes.getRouteLink(room.t, room)}>
		{roomTypes.getRoomName(room.t, room)}
	</a>
	{i === rooms.length - 1 ? '.' : ', '}
</>);

export const StepThree = ({ deletedRooms, keptRooms, onConfirm, onCancel }) => {
	const t = useTranslation();

	return <GenericModal
		variant='danger'
		icon='trash'
		title={t('Deleting')}
		onConfirm={onConfirm}
		onCancel={onCancel}
		confirmText={t('Continue')}
	>
		<p>{t('Teams_delete_team')}</p>
		<p>
			{t('Teams_deleted_channels')}{' '}
			<RoomList rooms={deletedRooms}/>
		</p>
		<p>
			{t('Teams_kept_channels')}{' '}
			<RoomList rooms={keptRooms}/>
		</p>

	</GenericModal>;
};

export const DeleteTeam = ({ onCancel, onConfirm, rooms }) => {
	const [step, setStep] = useState(1);
	const [deletedRooms, setDeletedRooms] = useState([]);
	const [keptRooms, setKeptRooms] = useState([]);

	const onContinue = useMutableCallback(() => setStep(step + 1));

	if (step === 2) {
		return <StepTwo
			rooms={rooms}
			onCancel={onCancel}
			params={{}}
			onChangeParams={(...args) => console.log(args)}
			onConfirm={onContinue}
		/>;
	}

	if (step === 3) {
		return <StepThree onConfirm={onConfirm}/>;
	}

	return <StepOne onConfirm={onContinue} onCancel={onCancel} />;
};

// export default DeleteTeam;
