import { Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { IRoom } from '../../../../../../../definition/IRoom';
import VerticalBar from '../../../../../../components/VerticalBar';
import { useTranslation } from '../../../../../../contexts/TranslationContext';
import AgentField from '../AgentField';
import { InfoField } from './InfoField';

type VoipInfoPropsType = {
	guest: any;
	servedBy: IRoom['servedBy'];
	onClickClose: () => void;
	onClickReport: () => void;
	onClickCall: () => void;
};

export const VoipInfo = ({ guest, servedBy, onClickClose, onClickReport, onClickCall }: VoipInfoPropsType): ReactElement => {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='phone' />
				<VerticalBar.Text>{t('Call_Information')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClickClose} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<InfoField label={t('Contact')} info={guest.name} />
				<InfoField label={t('Phone_Number')} info={guest.phone} />
				<InfoField label={t('Queue')} info={guest.queue} />
				<InfoField label={t('Last_Call')} info={guest.lastCall} />
				<InfoField label={t('Waiting_Time')} info={guest.waitingTime} />
				<InfoField label={t('Talk_Time')} info={guest.talkTime} />
				<InfoField label={t('Hold_Time')} info={guest.holdTime} />

				<AgentField agent={servedBy} />
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
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
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};
