import type { IVoipRoom } from '@rocket.chat/core-typings';
import { Box, Icon, Chip, ButtonGroup } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import moment from 'moment';
import type { ReactElement } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { InfoField } from './InfoField';
import { VoipInfoCallButton } from './VoipInfoCallButton';
import {
	ContextualbarIcon,
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
	ContextualbarFooter,
} from '../../../../../components/Contextualbar';
import { InfoPanel, InfoPanelField, InfoPanelLabel, InfoPanelText } from '../../../../../components/InfoPanel';
import { UserStatus } from '../../../../../components/UserStatus';
import { useIsCallReady } from '../../../../../contexts/CallContext';
import { parseOutboundPhoneNumber } from '../../../../../lib/voip/parseOutboundPhoneNumber';
import AgentInfoDetails from '../../../components/AgentInfoDetails';
import AgentField from '../../components/AgentField';

type VoipInfoPropsType = {
	room: IVoipRoom;
	onClickClose: () => void;
	onClickReport?: () => void;
};

export const VoipInfo = ({ room, onClickClose /* , onClickReport  */ }: VoipInfoPropsType): ReactElement => {
	const { t } = useTranslation();
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
			<ContextualbarHeader expanded>
				<ContextualbarIcon name='phone' />
				<ContextualbarTitle>{t('Call_Information')}</ContextualbarTitle>
				<ContextualbarClose onClick={onClickClose} />
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<InfoPanel>
					<InfoPanelField>
						<InfoPanelLabel>{t('Channel')}</InfoPanelLabel>
						<Box color='default'>
							<Icon size='x24' name='phone' verticalAlign='middle' />
							{t('Voice_Call')}
						</Box>
					</InfoPanelField>
					{servedBy && <AgentField isSmall agent={servedBy} />}
					{v && _name && (
						<InfoPanelField>
							<InfoPanelLabel>{t('Contact')}</InfoPanelLabel>
							<Box display='flex'>
								<UserAvatar size='x28' username={_name} />
								<AgentInfoDetails mis={8} name={parseOutboundPhoneNumber(_name)} status={<UserStatus status={v?.status} />} />
							</Box>
						</InfoPanelField>
					)}
					{phoneNumber && <InfoField label={t('Caller_Id')} info={parseOutboundPhoneNumber(phoneNumber)} />}
					{queue && <InfoField label={t('Queue')} info={queue} />}
					{endedAt && <InfoField label={t('Last_Call')} info={endedAt} />}
					<InfoField label={t('Waiting_Time')} info={waiting || t('Not_Available')} />
					<InfoField label={t('Talk_Time')} info={duration || t('Not_Available')} />
					<InfoField label={t('Hold_Time')} info={hold || t('Not_Available')} />
					<InfoPanelField>
						<InfoPanelLabel>{t('Wrap_Up_Notes')}</InfoPanelLabel>
						<InfoPanelText withTruncatedText={false}>{shouldShowWrapup ? lastMessage?.msg : t('Not_Available')}</InfoPanelText>
						{shouldShowTags && (
							<InfoPanelText>
								<Box display='flex' flexDirection='row' alignItems='center'>
									{tags?.map((tag: string) => (
										<Chip mie={4} key={tag} value={tag}>
											{tag}
										</Chip>
									))}
								</Box>
							</InfoPanelText>
						)}
					</InfoPanelField>
				</InfoPanel>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
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
			</ContextualbarFooter>
		</>
	);
};
