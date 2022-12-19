import type { IVoipRoom, ICallerInfo, VoIpCallerInfo } from '@rocket.chat/core-typings';
import { VoipClientEvents } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Button, ButtonGroup, Icon, SidebarFooter, Menu, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, MouseEvent, ReactNode } from 'react';
import React from 'react';

import type { VoipFooterMenuOptions } from '../../../../ee/client/hooks/useVoipFooterMenu';
import type { CallActionsType } from '../../../contexts/CallContext';
import { useOmnichannelContactLabel } from './hooks/useOmnichannelContactLabel';

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
	callsInQueue: string;
	createRoom: (caller: ICallerInfo, callDirection?: IVoipRoom['direction']) => Promise<IVoipRoom['_id']>;
	openRoom: (rid: IVoipRoom['_id']) => void;
	dispatchEvent: (params: { event: VoipClientEvents; rid: string; comment?: string }) => void;
	openedRoomInfo: { v: { token?: string | undefined }; rid: string };
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
	createRoom,
	openRoom,
	callsInQueue,
	dispatchEvent,
	openedRoomInfo,
	isEnterprise = false,
	children,
	options,
}: VoipFooterPropsType): ReactElement => {
	const contactLabel = useOmnichannelContactLabel(caller);
	const t = useTranslation();

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
			return t('Hold_EE_only');
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
				<Box display='flex' justifyContent='center' fontScale='c1' color='white' mbe='14px'>
					{callsInQueue}
				</Box>
				<Box display='flex' flexDirection='row' h='24px' mi='16px' mbs='12px' mbe='8px' justifyContent='space-between' alignItems='center'>
					<Box color='neutral-500' fontScale='c2' withTruncatedText>
						{title}
					</Box>
					{(callerState === 'IN_CALL' || callerState === 'ON_HOLD') && (
						<ButtonGroup medium className='sidebar--custom-colors' onClick={(e): void => e.stopPropagation()}>
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
							{options && <Menu color='neutral-500' data-tooltip={t('More_options')} options={options} />}
						</ButtonGroup>
					)}
				</Box>
				<Box display='flex' flexDirection='row' mi='16px' mbe='12px' justifyContent='space-between' alignItems='center'>
					<Box>
						<Box color='white' fontScale='p2' withTruncatedText>
							{contactLabel || t('Anonymous')}
						</Box>
						<Box color='hint' fontScale='c1' withTruncatedText>
							{subtitle}
						</Box>
					</Box>

					<ButtonGroup medium>
						{(callerState === 'IN_CALL' || callerState === 'ON_HOLD' || callerState === 'OFFER_SENT') && (
							<Button
								small
								square
								danger
								disabled={paused}
								aria-label={t('End_call')}
								data-tooltip={t('End_Call')}
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
							<Button data-tooltip={t('Decline')} aria-label={t('Decline')} small square danger onClick={callActions.reject}>
								<Icon name='phone-off' size='x16' />
							</Button>
						)}
						{callerState === 'OFFER_RECEIVED' && (
							<Button
								small
								square
								success
								data-tooltip={t('Accept')}
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
