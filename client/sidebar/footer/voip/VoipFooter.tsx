import { Box, Button, ButtonGroup, Icon, SidebarFooter } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { ICallerInfo } from '../../../../definition/voip/ICallerInfo';
import { VoIpCallerInfo } from '../../../../definition/voip/VoIpCallerInfo';
import { CallActionsType } from '../../../contexts/CallContext';

type VoipFooterPropsType = {
	callerName: ICallerInfo['callerName'];
	callerState: VoIpCallerInfo['state'];
	callActions: CallActionsType;
	title: string;
	subtitle: string;
	muted: boolean;
	paused: boolean;
	toggleMic: (state: boolean) => void;
	togglePause: (state: boolean) => void;
	popover: {
		mute: string;
		holdCall: string;
		acceptCall: string;
		endCall: string;
	};
};

export const VoipFooter = ({
	callerName,
	callerState,
	callActions,
	title,
	subtitle,
	muted,
	paused,
	toggleMic,
	togglePause,
	popover,
}: VoipFooterPropsType): ReactElement => (
	<SidebarFooter elevated>
		<Box display='flex' flexDirection='row' mi='16px' mbs='12px' mbe='8px' justifyContent='space-between' alignItems='center'>
			<Box color='neutral-500' fontScale='c2' withTruncatedText>
				{title}
			</Box>
			{(callerState === 'IN_CALL' || callerState === 'ON_HOLD') && (
				<ButtonGroup medium>
					<Button disabled={paused} title={popover.mute} small square nude onClick={(): void => toggleMic(!muted)}>
						{muted ? <Icon name='mic' color='neutral-500' size='x24' /> : <Icon name='mic' color='info' size='x24' />}
					</Button>
					<Button title={popover.holdCall} small square nude onClick={(): void => togglePause(!paused)}>
						{paused ? (
							<Icon name='pause-unfilled' color='neutral-500' size='x24' />
						) : (
							<Icon name='pause-unfilled' color='info' size='x24' />
						)}
					</Button>
				</ButtonGroup>
			)}
		</Box>
		<Box display='flex' flexDirection='row' mi='16px' mbe='12px' justifyContent='space-between' alignItems='center'>
			<Box>
				<Box color='white' fontScale='p2' withTruncatedText>
					{callerName}
				</Box>
				<Box color='hint' fontScale='c1' withTruncatedText>
					{subtitle}
				</Box>
			</Box>

			<ButtonGroup medium>
				{callerState === 'IN_CALL' && (
					<Button
						title={popover.endCall}
						disabled={paused}
						small
						square
						danger
						primary
						onClick={(): unknown => {
							toggleMic(false);
							togglePause(false);
							return callActions.end();
						}}
					>
						<Icon name='phone-off' size='x16' />
					</Button>
				)}
				{callerState === 'OFFER_RECEIVED' && (
					<Button title={popover.endCall} small square danger primary onClick={callActions.reject}>
						<Icon name='phone-off' size='x16' />
					</Button>
				)}
				{callerState === 'OFFER_RECEIVED' && (
					<Button title={popover.acceptCall} small square success primary onClick={callActions.pickUp}>
						<Icon name='phone' size='x16' />
					</Button>
				)}
			</ButtonGroup>
		</Box>
	</SidebarFooter>
);
