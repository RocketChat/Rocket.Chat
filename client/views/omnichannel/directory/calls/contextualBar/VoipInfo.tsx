import { Box, Icon } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { ReactElement } from 'react';

import { IVoipRoom } from '../../../../../../definition/IRoom';
import UserCard from '../../../../../components/UserCard';
import { UserStatus } from '../../../../../components/UserStatus';
import VerticalBar from '../../../../../components/VerticalBar';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import InfoPanel from '../../../../InfoPanel';
import AgentField from '../../chats/contextualBar/AgentField';
import { InfoField } from './InfoField';

type VoipInfoPropsType = {
	room: IVoipRoom;
	onClickClose: () => void;
	onClickReport?: () => void;
	onClickCall?: () => void;
};

export const VoipInfo = ({ room, onClickClose /* , onClickReport, onClickCall */ }: VoipInfoPropsType): ReactElement => {
	const t = useTranslation();

	const { servedBy, queue, v, fname, name, callDuration, callTotalHoldTime, callEndedAt, callWaitingTime } = room;
	const duration = callDuration && moment.duration(callDuration / 1000, 'seconds').humanize();
	const waiting = callWaitingTime && moment.duration(callWaitingTime / 1000, 'seconds').humanize();
	const hold = callTotalHoldTime && moment.duration(callTotalHoldTime, 'seconds').humanize();
	const endedAt = callEndedAt && moment(callEndedAt).format('LLL');
	const phoneNumber = Array.isArray(v?.phone) ? v?.phone[0]?.phoneNumber : v?.phone;

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='phone' />
				<VerticalBar.Text>{t('Call_Information')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClickClose} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<InfoPanel>
					<InfoPanel.Field>
						<InfoPanel.Label>{t('Channel')}</InfoPanel.Label>
						<Box>
							<Icon size='x24' name='phone' />
							{t('Voice_Call')}
						</Box>
					</InfoPanel.Field>
					{servedBy && <AgentField isSmall agent={servedBy} />}
					{v && (name || fname) && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Contact')}</InfoPanel.Label>
							<Box display='flex'>
								<UserAvatar size='x28' username={name || fname} />
								<UserCard.Username mis='x8' title={name || fname} name={name || fname} status={<UserStatus status={v?.status} />} />
							</Box>
						</InfoPanel.Field>
					)}
					{phoneNumber && <InfoField label={t('Caller_Id')} info={phoneNumber} />}
					{queue && <InfoField label={t('Queue')} info={queue} />}
					{endedAt && <InfoField label={t('Last_Call')} info={endedAt} />}
					<InfoField label={t('Waiting_Time')} info={waiting || t('Not_Available')} />
					<InfoField label={t('Talk_Time')} info={duration || t('Not_Available')} />
					<InfoField label={t('Hold_Time')} info={hold || t('Not_Available')} />
				</InfoPanel>

				{/* <InfoField label={t('Wrap_Up_Note')} info={guest.holdTime} /> */}
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
