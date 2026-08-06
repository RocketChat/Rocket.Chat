import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Icon, IconButton } from '@rocket.chat/fuselage';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useTranslation } from 'react-i18next';

import CallSummary from './CallSummary';

type RingingCallItemProps = {
	call: JoinableVideoConference;
	/** Whether the user already stopped the sound for this one. */
	silenced: boolean;
	onAccept: (callId: string) => void;
	onReject: (callId: string) => void;
	onSilence: (callId: string) => void;
};

/**
 * A call that is ringing *now*, at the top of the list and given more room than the rest.
 *
 * This replaces the popup that used to take over the screen for an incoming call. A popup demanded an answer
 * before anything else could happen; a call in a list can be answered, turned down, or left ringing while the
 * user finishes a sentence — and it is in the same place as every other call, so there is one place to look.
 *
 * The actions sit *below* the call rather than beside it: they are the point of this item, and a ringing call is
 * worth the width.
 */
const RingingCallItem = ({ call, silenced, onAccept, onReject, onSilence }: RingingCallItemProps) => {
	const { t } = useTranslation();

	// Only offer to stop a sound that is playing: a ring this client never heard — a reload, or a call rung before
	// the page loaded — has nothing to silence, and is not something the user silenced either.
	const incomingCalls = useVideoConfIncomingCalls();
	const heardHere = incomingCalls.some(({ callId, dismissed }) => callId === call.callId && !dismissed);
	const audible = heardHere && !silenced;

	return (
		<Box marginBlockEnd={12} paddingBlock={4}>
			{/* The same thing the calls below say about themselves — a conference, its name, who is already in it.
			    That this one is *ringing* is what the colour and the actions below say; that it is incoming is said
			    once, above the group. */}
			<Box marginBlockEnd={8}>
				<CallSummary call={call} ringing>
					{audible && (
						<IconButton tiny icon='bell-off' title={t('Silence')} aria-label={t('Silence')} onClick={() => onSilence(call.callId)} />
					)}
					{/* Silenced: the same icon, with nothing left to press — it says why it went quiet. */}
					{silenced && <Icon name='bell-off' size='x16' color='hint' title={t('Incoming_call_silenced')} />}
				</CallSummary>
			</Box>
			{/* Accept first, then decline, in the order the calls below use: the offer, then the way out of it. */}
			<ButtonGroup stretch>
				<Button small success onClick={() => onAccept(call.callId)}>
					{t('Accept')}
				</Button>
				<Button small danger secondary onClick={() => onReject(call.callId)}>
					{t('Decline')}
				</Button>
			</ButtonGroup>
		</Box>
	);
};

export default RingingCallItem;
