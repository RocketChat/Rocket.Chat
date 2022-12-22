import type { IUser } from '@rocket.chat/core-typings';
import { Box, Button, Throbber } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { MouseEventHandler, ReactElement } from 'react';
import React from 'react';

import { OtrRoomState } from '../../../../../app/otr/lib/OtrRoomState';
import VerticalBar from '../../../../components/VerticalBar';
import OTREstablished from './components/OTREstablished';
import OTRStates from './components/OTRStates';

type OTRProps = {
	isOnline: boolean;
	onClickClose: MouseEventHandler<HTMLOrSVGElement>;
	onClickStart: () => void;
	onClickEnd: () => void;
	onClickRefresh: () => void;
	otrState: string;
	peerUsername: IUser['username'];
};

const OTR = ({ isOnline, onClickClose, onClickStart, onClickEnd, onClickRefresh, otrState, peerUsername }: OTRProps): ReactElement => {
	const t = useTranslation();

	const renderOTRState = (): ReactElement => {
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
						<Box mb='x16'>
							<Throbber />
						</Box>
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
				<VerticalBar.Icon name='stopwatch' />
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
