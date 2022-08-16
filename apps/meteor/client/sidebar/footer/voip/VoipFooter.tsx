import type { IVoipRoom } from '@rocket.chat/core-typings';
import { ICallerInfo, VoIpCallerInfo, VoipClientEvents } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, ButtonGroup, Icon, SidebarFooter, Menu, IconButton } from '@rocket.chat/fuselage';
import React, { ReactElement, MouseEvent, ReactNode } from 'react';

import type { VoipFooterMenuOptions } from '../../../../ee/client/hooks/useVoipFooterMenu';
import { parseOutboundPhoneNumber } from '../../../../ee/client/lib/voip/parseOutboundPhoneNumber';
import { CallActionsType } from '../../../contexts/CallContext';

type VoipFooterPropsType = {
	caller: ICallerInfo;
	callerState: VoIpCallerInfo['state'];
	callActions: CallActionsType;
	title: string;
	subtitle: string;
	muted: boolean;
	paused: boolean;
	toggleMic: (state: boolean) => void;
	togglePause: (state: boolean) => void;
	tooltips: {
		mute: string;
		holdCall: string;
		holdCallEEOnly: string;
		acceptCall: string;
		endCall: string;
	};
	callsInQueue: string;

	createRoom: (caller: ICallerInfo, callDirection?: IVoipRoom['direction']) => Promise<IVoipRoom['_id']>;
	openRoom: (rid: IVoipRoom['_id']) => void;
	dispatchEvent: (params: { event: VoipClientEvents; rid: string; comment?: string }) => void;
	openedRoomInfo: { v: { token?: string | undefined }; rid: string };
	anonymousText: string;
	isEnterprise: boolean;
	children?: ReactNode;
	options: VoipFooterMenuOptions;
};

export const VoipFooter = ({
	caller,
	callerState,
	callActions,
	title,
	subtitle,
	muted,
	paused,
	toggleMic,
	togglePause,
	tooltips,
	createRoom,
	openRoom,
	callsInQueue,
	dispatchEvent,
	openedRoomInfo,
	anonymousText,
	isEnterprise = false,
	children,
	options,
}: VoipFooterPropsType): ReactElement => {
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
				<Box display='flex' justifyContent='center' fontScale='c1' color='white' mbe='14px'>
					{callsInQueue}
				</Box>
				<Box display='flex' flexDirection='row' h='24px' mi='16px' mbs='12px' mbe='8px' justifyContent='space-between' alignItems='center'>
					<Box color='neutral-500' fontScale='c2' withTruncatedText>
						{title}
					</Box>
					{(callerState === 'IN_CALL' || callerState === 'ON_HOLD') && (
						<ButtonGroup medium className='sidebar--custom-colors'>
							<IconButton
								disabled={paused}
								title={tooltips.mute}
								color={muted ? 'neutral-500' : 'info'}
								icon='mic'
								small
								onClick={(e): void => {
									e.stopPropagation();
									toggleMic(!muted);
								}}
							/>
							<IconButton
								title={isEnterprise ? tooltips.holdCall : tooltips.holdCallEEOnly}
								disabled={!isEnterprise}
								icon='pause-unfilled'
								color={paused ? 'neutral-500' : 'info'}
								small
								onClick={handleHold}
							/>
							{options && <Menu color='neutral-500' options={options} />}
						</ButtonGroup>
					)}
				</Box>
				<Box display='flex' flexDirection='row' mi='16px' mbe='12px' justifyContent='space-between' alignItems='center'>
					<Box>
						<Box color='white' fontScale='p2' withTruncatedText>
							{caller.callerName || parseOutboundPhoneNumber(caller.callerId) || anonymousText}
						</Box>
						<Box color='hint' fontScale='c1' withTruncatedText>
							{subtitle}
						</Box>
					</Box>

					<ButtonGroup medium>
						{(callerState === 'IN_CALL' || callerState === 'ON_HOLD' || callerState === 'OFFER_SENT') && (
							<Button
								title={tooltips.endCall}
								disabled={paused}
								small
								square
								danger
								onClick={(e): unknown => {
									e.stopPropagation();
									muted && toggleMic(false);
									paused && togglePause(false);
									return callActions.end();
								}}
							>
								<Icon name='phone-off' size='x16' />
							</Button>
						)}
						{callerState === 'OFFER_RECEIVED' && (
							<Button title={tooltips.endCall} small square danger onClick={callActions.reject}>
								<Icon name='phone-off' size='x16' />
							</Button>
						)}
						{callerState === 'OFFER_RECEIVED' && (
							<Button
								title={tooltips.acceptCall}
								small
								square
								success
								onClick={async (): Promise<void> => {
									callActions.pickUp();
									const rid = await createRoom(caller);
									dispatchEvent({ event: VoipClientEvents['VOIP-CALL-STARTED'], rid });
								}}
							>
								<Icon name='phone' size='x16' />
							</Button>
						)}
					</ButtonGroup>
				</Box>
			</Box>
			{children}
		</SidebarFooter>
	);
};
