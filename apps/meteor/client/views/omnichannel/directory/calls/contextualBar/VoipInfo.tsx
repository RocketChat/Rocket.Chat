import type { IVoipRoom } from '@rocket.chat/core-typings';
import { Box, Icon, Chip, ButtonGroup } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import React, { ReactElement, useMemo } from 'react';

import { parseOutboundPhoneNumber } from '../../../../../../ee/client/lib/voip/parseOutboundPhoneNumber';
import { UserStatus } from '../../../../../components/UserStatus';
import VerticalBar from '../../../../../components/VerticalBar';
import UserAvatar from '../../../../../components/avatar/UserAvatar';
import { useIsCallReady } from '../../../../../contexts/CallContext';
import InfoPanel from '../../../../InfoPanel';
import AgentInfoDetails from '../../../components/AgentInfoDetails';
import AgentField from '../../chats/contextualBar/AgentField';
import { InfoField } from './InfoField';
import { VoipInfoCallButton } from './VoipInfoCallButton';

type VoipInfoPropsType = {
	room: IVoipRoom;
	onClickClose: () => void;
	onClickReport?: () => void;
};

export const VoipInfo = ({ room, onClickClose /* , onClickReport  */ }: VoipInfoPropsType): ReactElement => {
	const t = useTranslation();
	const isCallReady = useIsCallReady();

	const { servedBy, queue, v, fname, name, callDuration, callTotalHoldTime, closedAt, callWaitingTime, tags, lastMessage } = room;
	const duration = callDuration && moment.utc(callDuration).format('HH:mm:ss');
	const waiting = callWaitingTime && moment.utc(callWaitingTime).format('HH:mm:ss');
	const hold = callTotalHoldTime && moment.utc(callTotalHoldTime).format('HH:mm:ss');
	const endedAt = closedAt && moment(closedAt).format('LLL');
	const phoneNumber = Array.isArray(v?.phone) ? v?.phone[0]?.phoneNumber : v?.phone;
	const shouldShowWrapup = useMemo(() => lastMessage?.t === 'voip-call-wrapup' && lastMessage?.msg, [lastMessage]);
	const shouldShowTags = useMemo(() => tags && tags.length > 0, [tags]);
	const _name = fname || name;

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
					{v && _name && (
						<InfoPanel.Field>
							<InfoPanel.Label>{t('Contact')}</InfoPanel.Label>
							<Box display='flex'>
								<UserAvatar size='x28' username={_name} />
								<AgentInfoDetails mis='x8' name={parseOutboundPhoneNumber(_name)} status={<UserStatus status={v?.status} />} />
							</Box>
						</InfoPanel.Field>
					)}
					{phoneNumber && <InfoField label={t('Caller_Id')} info={parseOutboundPhoneNumber(phoneNumber)} />}
					{queue && <InfoField label={t('Queue')} info={queue} />}
					{endedAt && <InfoField label={t('Last_Call')} info={endedAt} />}
					<InfoField label={t('Waiting_Time')} info={waiting || t('Not_Available')} />
					<InfoField label={t('Talk_Time')} info={duration || t('Not_Available')} />
					<InfoField label={t('Hold_Time')} info={hold || t('Not_Available')} />
					<InfoPanel.Field>
						<InfoPanel.Label>{t('Wrap_Up_Notes')}</InfoPanel.Label>
						<InfoPanel.Text>{shouldShowWrapup ? lastMessage?.msg : t('Not_Available')}</InfoPanel.Text>
						{shouldShowTags && (
							<InfoPanel.Text>
								<Box display='flex' flexDirection='row' alignItems='center'>
									{tags?.map((tag: string) => (
										<Chip mie='x4' key={tag} value={tag}>
											{tag}
										</Chip>
									))}
								</Box>
							</InfoPanel.Text>
						)}
					</InfoPanel.Field>
				</InfoPanel>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				{/* TODO: Introduce this buttons [Not part of MVP] */}
				<ButtonGroup stretch>
					{/* <Button danger onClick={onClickReport}>
						<Box display='flex' justifyContent='center' fontSize='p2'>
							<Icon name='ban' size='x20' mie='4px' />
							{t('Report_Number')}
						</Box>
					</Button> */}
					{isCallReady && <VoipInfoCallButton phoneNumber={phoneNumber} />}
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};
