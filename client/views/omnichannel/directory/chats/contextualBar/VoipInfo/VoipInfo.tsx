// import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { ReactElement } from 'react';

import { IVoipRoom } from '../../../../../../../definition/IRoom';
import VerticalBar from '../../../../../../components/VerticalBar';
import { useTranslation } from '../../../../../../contexts/TranslationContext';
import AgentField from '../AgentField';
import { InfoField } from './InfoField';

type VoipInfoPropsType = {
	room: IVoipRoom;
	onClickClose: () => void;
	onClickReport: () => void;
	onClickCall: () => void;
};

export const VoipInfo = ({ room, onClickClose /* , onClickReport, onClickCall */ }: VoipInfoPropsType): ReactElement => {
	const t = useTranslation();

	const duration = room.callDuration && moment.duration(room.callDuration / 1000, 'seconds').humanize();
	const waiting = room.callWaitingTime && moment.duration(room.callWaitingTime / 1000, 'seconds').humanize();
	const hold = room.callTotalHoldTime && moment.duration(room.callTotalHoldTime, 'seconds').humanize();

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='phone' />
				<VerticalBar.Text>{t('Call_Information')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClickClose} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<InfoField label={t('Contact')} info={room.name || room.fname} />
				{room.v.phone && <InfoField label={t('Phone_Number')} info={room.v.phone} />}
				{room.queue && <InfoField label={t('Queue')} info={room.queue} />}
				{/* {room.lastCall && <InfoField label={t('Last_Call')} info={room.lastCall} />} */}
				<InfoField label={t('Waiting_Time')} info={waiting} />
				<InfoField label={t('Talk_Time')} info={duration} />
				<InfoField label={t('Hold_Time')} info={hold} />
				<AgentField agent={room.servedBy} />
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				{/* TODO: Introduce this buttons [Not part of MVP] */}
				{/* <ButtonGroup stretch>
					<Button danger onClick={onClickReport}>
						<Box display='flex' justifyContent='center' fontSize='p2'>
							<Icon name='ban' size='x20' mie='4px' />
							{t('Report_Number')}
						</Box>
					</Button>
					<Button onClick={onClickCall}>
						<Box display='flex' justifyContent='center' fontSize='p2'>
							<Icon name='phone' size='x20' mie='4px' />
							{t('Call')}
						</Box>
					</Button>
				</ButtonGroup> */}
			</VerticalBar.Footer>
		</>
	);
};
