import type { IVoipRoom, ICallerInfo, VoIpCallerInfo } from '@rocket.chat/core-typings';
import { VoipClientEvents } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, ButtonGroup, SidebarFooter, Menu, IconButton } from '@rocket.chat/fuselage';
import type { ReactElement, MouseEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useOmnichannelContactLabel } from './hooks/useOmnichannelContactLabel';
import type { CallActionsType } from '../../../contexts/CallContext';
import type { VoipFooterMenuOptions } from '../../../hooks/useVoipFooterMenu';

type VoipFooterProps = {
	caller: ICallerInfo;
	callerState: VoIpCallerInfo['state'];
	callActions: CallActionsType;
	title: string;
	subtitle: string;
	muted: boolean;
	paused: boolean;
	toggleMic: (state: boolean) => void;
	togglePause: (state: boolean) => void;
	callsInQueue: string;
	createRoom: (caller: ICallerInfo, callDirection?: IVoipRoom['direction']) => Promise<IVoipRoom['_id']>;
	openRoom: (rid: IVoipRoom['_id']) => void;
	dispatchEvent: (params: { event: VoipClientEvents; rid: string; comment?: string }) => void;
	openedRoomInfo: { v: { token?: string | undefined }; rid: string };
	isEnterprise: boolean;
	children?: ReactNode;
	options: VoipFooterMenuOptions;
};

const VoipFooter = ({
	caller,
	callerState,
	callActions,
	title,
	subtitle,
	muted,
	paused,
	toggleMic,
	togglePause,
	createRoom,
	openRoom,
	callsInQueue,
	dispatchEvent,
	openedRoomInfo,
	isEnterprise = false,
	children,
	options,
}: VoipFooterProps): ReactElement => {
	const contactLabel = useOmnichannelContactLabel(caller);
	const { t } = useTranslation();

	const cssClickable =
		callerState === 'IN_CALL' || callerState === 'ON_HOLD'
			? css`
					cursor: pointer;
				`
			: '';

	const handleHold = (e: MouseEvent<HTMLButtonElement>): void => {
		e.stopPropagation();
		const eventName = paused ? 'VOIP-CALL-UNHOLD' : 'VOIP-CALL-ON-HOLD';
		dispatchEvent({ event: VoipClientEvents[eventName], rid: openedRoomInfo.rid });
		togglePause(!paused);
	};

	const holdTitle = ((): string => {
		if (!isEnterprise) {
			return t('Hold_Premium_only');
		}
		return paused ? t('Resume') : t('Hold');
	})();

	return (
		<SidebarFooter elevated>
			<Box
				className={cssClickable}
				onClick={(): void => {
					if (callerState === 'IN_CALL' || callerState === 'ON_HOLD') {
						openRoom(openedRoomInfo.rid);
					}
				}}
			>
				<Box display='flex' justifyContent='center' fontScale='c1' color='font-default' mbe='14px'>
					{callsInQueue}
				</Box>
				<Box display='flex' flexDirection='row' h='24px' mi='16px' mbs='12px' mbe='8px' justifyContent='space-between' alignItems='center'>
					<Box color='font-default' fontScale='c2' withTruncatedText>
						{title}
					</Box>
					{(callerState === 'IN_CALL' || callerState === 'ON_HOLD') && (
						<ButtonGroup onClick={(e): void => e.stopPropagation()}>
							<IconButton
								small
								disabled={paused}
								icon={muted ? 'mic-off' : 'mic'}
								color={muted ? 'disabled' : 'hint'}
								data-tooltip={muted ? t('Turn_on_microphone') : t('Turn_off_microphone')}
								onClick={(e): void => {
									e.stopPropagation();
									toggleMic(!muted);
								}}
							/>
							<IconButton
								small
								data-tooltip={holdTitle}
								disabled={!isEnterprise}
								icon={paused ? 'pause' : 'pause-unfilled'}
								color={paused ? 'disabled' : 'hint'}
								onClick={handleHold}
							/>
							{options && <Menu color='disabled' data-tooltip={t('More_options')} options={options} />}
						</ButtonGroup>
					)}
				</Box>
				<Box display='flex' flexDirection='row' mi='16px' mbe='12px' justifyContent='space-between' alignItems='center'>
					<Box>
						<Box color='font-default' fontScale='p2' withTruncatedText>
							{contactLabel || t('Anonymous')}
						</Box>
						<Box color='font-default' fontScale='c1' withTruncatedText>
							{subtitle}
						</Box>
					</Box>

					<ButtonGroup>
						{(callerState === 'IN_CALL' || callerState === 'ON_HOLD' || callerState === 'OFFER_SENT') && (
							<Button
								small
								square
								danger
								icon='phone-off'
								disabled={paused}
								aria-label={t('End_call')}
								data-tooltip={t('End_Call')}
								onClick={(e): unknown => {
									e.stopPropagation();
									muted && toggleMic(false);
									paused && togglePause(false);
									return callActions.end();
								}}
							/>
						)}
						{callerState === 'OFFER_RECEIVED' && (
							<Button
								icon='phone-off'
								data-tooltip={t('Decline')}
								aria-label={t('Decline')}
								small
								square
								danger
								onClick={callActions.reject}
							/>
						)}
						{callerState === 'OFFER_RECEIVED' && (
							<Button
								small
								square
								success
								icon='phone'
								data-tooltip={t('Accept')}
								onClick={async (): Promise<void> => {
									callActions.pickUp();
									const rid = await createRoom(caller);
									dispatchEvent({ event: VoipClientEvents['VOIP-CALL-STARTED'], rid });
								}}
							/>
						)}
					</ButtonGroup>
				</Box>
			</Box>
			{children}
		</SidebarFooter>
	);
};

export default VoipFooter;
