import { Box } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { ReactElement } from 'react';

import { IVoipRoom } from '../../../../../../definition/IRoom';
import UserCard from '../../../../../components/UserCard';
import { UserStatus } from '../../../../../components/UserStatus';
import VerticalBar from '../../../../../components/VerticalBar';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import Field from '../../../components/Field';
import Info from '../../../components/Info';
import Label from '../../../components/Label';
import AgentField from '../../chats/contextualBar/AgentField';
import { InfoField } from './InfoField';

type VoipInfoPropsType = {
	room: IVoipRoom;
	onClickClose: () => void;
};

export const VoipInfo = ({ room, onClickClose }: VoipInfoPropsType): ReactElement => {
	const t = useTranslation();

	const { servedBy, queue, v, fname, callDuration, callTotalHoldTime, callEndedAt, callWaitingTime } = room;

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='phone' />
				<VerticalBar.Text>{t('Call_Information')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClickClose} />
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				{/* <InfoField label={t('Channel')} info={} /> */}
				{servedBy && <AgentField agent={servedBy} />}
				{v && fname && (
					<Field>
						<Label>{t('Contact')}</Label>
						<Info>
							<Box display='flex'>
								<UserAvatar size='x40' username={fname} />
								<UserCard.Username mis='x10' title={fname} name={fname} status={<UserStatus status={v?.status} />} />
							</Box>
						</Info>
					</Field>
				)}
				{fname && <InfoField label={t('Contact')} info={fname} />}
				{v?.phone && <InfoField label={t('Caller_Id')} info={v?.phone} />}
				{queue && <InfoField label={t('Queue')} info={queue} />}
				{callEndedAt && <InfoField label={t('Last_Call')} info={moment(callEndedAt).format('L LTS')} />}
				{callWaitingTime !== undefined && (
					<InfoField label={t('Waiting_Time')} info={moment.duration(callWaitingTime / 1000, 'seconds').humanize()} />
				)}
				{callDuration !== undefined && (
					<InfoField label={t('Talk_Time')} info={moment.duration(callDuration / 1000, 'seconds').humanize()} />
				)}
				{callTotalHoldTime !== undefined && (
					<InfoField label={t('Hold_Time')} info={moment.duration(callTotalHoldTime, 'seconds').humanize()} />
				)}
				{/* <InfoField label={t('Wrap_Up_Note')} info={guest.holdTime} /> */}
			</VerticalBar.ScrollableContent>
		</>
	);
	moment.duration(callTotalHoldTime / 1000).humanize();
};
