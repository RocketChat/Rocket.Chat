import { Box, Button, Throbber } from '@rocket.chat/fuselage';
import React from 'react';

import { OtrRoomState } from '../../../../../app/otr/client/OtrRoomState';
import VerticalBar from '../../../../components/VerticalBar';
import { useTranslation } from '../../../../contexts/TranslationContext';
import OTREstablished from './components/OTREstablished';
import OTRStates from './components/OTRStates';

const OTR = ({ isOnline, onClickClose, onClickStart, onClickEnd, onClickRefresh, otrState, peerUsername }) => {
	const t = useTranslation();

	const renderOTRState = () => {
		switch (otrState) {
			case OtrRoomState.NOT_STARTED:
				return (
					<Button onClick={onClickStart} primary>
						{t('Start_OTR')}
					</Button>
				);
			case OtrRoomState.ESTABLISHING:
				return (
					<Box>
						<Box fontScale='p2'>{t('Please_wait_while_OTR_is_being_established')}</Box>
						<Throbber inheritColor />
					</Box>
				);
			case OtrRoomState.ESTABLISHED:
				return <OTREstablished onClickEnd={onClickEnd} onClickRefresh={onClickRefresh} />;
			case OtrRoomState.DECLINED:
				return (
					<OTRStates
						title={t('OTR_Chat_Declined_Title')}
						description={t('OTR_Chat_Declined_Description', peerUsername || '')}
						icon='cross'
						onClickStart={onClickStart}
					/>
				);
			case OtrRoomState.TIMEOUT:
				return (
					<OTRStates
						title={t('OTR_Chat_Timeout_Title')}
						description={t('OTR_Chat_Timeout_Description', peerUsername || '')}
						icon='clock'
						onClickStart={onClickStart}
					/>
				);
			default:
				return (
					<OTRStates
						title={t('OTR_Chat_Error_Title')}
						description={t('OTR_Chat_Error_Description')}
						icon='warning'
						onClickStart={onClickStart}
					/>
				);
		}
	};

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='shredder' />
				<VerticalBar.Text>{t('OTR')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>

			<VerticalBar.ScrollableContent p='x24'>
				<Box fontScale='h4'>{t('Off_the_record_conversation')}</Box>
				{isOnline ? renderOTRState() : <Box fontScale='p2m'>{t('OTR_is_only_available_when_both_users_are_online')}</Box>}
			</VerticalBar.ScrollableContent>
		</>
	);
};

export default OTR;
