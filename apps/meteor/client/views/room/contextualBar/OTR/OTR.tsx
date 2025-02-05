import type { IUser } from '@rocket.chat/core-typings';
import { Box, Button, Callout, Throbber } from '@rocket.chat/fuselage';
import type { MouseEventHandler, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import OTREstablished from './components/OTREstablished';
import OTRStates from './components/OTRStates';
import { OtrRoomState } from '../../../../../app/otr/lib/OtrRoomState';
import {
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarTitle,
	ContextualbarClose,
	ContextualbarScrollableContent,
} from '../../../../components/Contextualbar';
import { useRoom } from '../../contexts/RoomContext';

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
	const { t } = useTranslation();
	const room = useRoom();

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
						<Box mb={16}>
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
						description={t('OTR_Chat_Declined_Description', { postProcess: 'sprintf', sprintf: [peerUsername || ''] })}
						icon='cross'
						onClickStart={onClickStart}
					/>
				);
			case OtrRoomState.TIMEOUT:
				return (
					<OTRStates
						title={t('OTR_Chat_Timeout_Title')}
						description={t('OTR_Chat_Timeout_Description', { postProcess: 'sprintf', sprintf: [peerUsername || ''] })}
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

	const renderOTRBody = (): ReactElement => {
		if (room.encrypted) {
			return (
				<Callout title={t('OTR_not_available')} type='warning'>
					{t('OTR_not_available_e2ee')}
				</Callout>
			);
		}

		if (!isOnline) {
			return <Box fontScale='p2m'>{t('OTR_is_only_available_when_both_users_are_online')}</Box>;
		}

		return renderOTRState();
	};

	return (
		<>
			<ContextualbarHeader>
				<ContextualbarIcon name='stopwatch' />
				<ContextualbarTitle>{t('OTR')}</ContextualbarTitle>
				{onClickClose && <ContextualbarClose onClick={onClickClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent p={24} color='default'>
				<Box fontScale='h4'>{t('Off_the_record_conversation')}</Box>
				{renderOTRBody()}
			</ContextualbarScrollableContent>
		</>
	);
};

export default OTR;
