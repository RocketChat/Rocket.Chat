// import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
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
				{room.callWaitingTime && <InfoField label={t('Waiting_Time')} info={room.callWaitingTime} />}
				{room.callDuration && <InfoField label={t('Talk_Time')} info={room.callDuration} />}
				{room.callTotalHoldTime && <InfoField label={t('Hold_Time')} info={room.callTotalHoldTime} />}
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
