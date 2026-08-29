import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { isRingingVideoConferenceMember } from '@rocket.chat/core-typings';
import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import { useTranslation } from 'react-i18next';

import { canDeclineCall } from './useOngoingCalls';
import Extended from '../../sidebar/Item/Extended';

type CallListItemProps = {
	call: JoinableVideoConference;
	/** Whether this client has already been asked to stop making noise about this call. */
	silenced?: boolean;
	onJoin: (callId: string) => void;
	onDecline: (callId: string) => void;
	onSilence?: (callId: string) => void;
};

/**
 * One call in the list, whatever state it is in: ringing, merely running, already joined, or turned down.
 *
 * The state is read off the call rather than chosen by the caller, because it is the same row either way — the
 * sidebar's room item with a video mark instead of an avatar — and only the two slots at its edges differ. A
 * list that had to pick a component per state ended up re-deriving that state to do the picking.
 */
const CallListItem = ({ call, silenced = false, onJoin, onDecline, onSilence }: CallListItemProps) => {
	const { t } = useTranslation();

	const ringing = isRingingVideoConferenceMember({ ringingAt: call.ringingAt });

	// Whether *this* client is the one making the noise — a ring can be sounding on another of the user's
	// sessions, and there is nothing to silence here if it isn't sounding here.
	const incomingCalls = useVideoConfIncomingCalls();
	const audible = ringing && !silenced && incomingCalls.some(({ callId, dismissed }) => callId === call.callId && !dismissed);

	const decline = (
		<IconButton mini secondary icon='cross' title={t('Decline')} aria-label={t('Decline')} onClick={() => onDecline(call.callId)} />
	);

	const actions = (() => {
		if (ringing) {
			return (
				<>
					{silenced && <Icon name='bell-off' size='x16' color='hint' title={t('Incoming_call_silenced')} />}
					{audible && onSilence && (
						<IconButton
							mini
							secondary
							icon='bell-off'
							title={t('Silence')}
							aria-label={t('Silence')}
							onClick={() => onSilence(call.callId)}
						/>
					)}
					{decline}
				</>
			);
		}

		if (canDeclineCall(call)) {
			return decline;
		}

		// Turned down, and keeping its place in the list as the way back in: there is nothing left to decline,
		// so the button's place says what happened instead.
		if (call.declined) {
			return (
				<Box fontScale='micro' color='hint'>
					({t('Declined')})
				</Box>
			);
		}

		return undefined;
	})();

	return (
		<Extended
			onClick={(event) => {
				event.preventDefault();

				if ((event.target as HTMLElement).closest('button')) {
					return;
				}

				onJoin(call.callId);
			}}
			icon={<Icon name='video' size='x16' />}
			title={call.name}
			time={call.createdAt}
			timeLabel={
				ringing ? (
					<Box is='span' color='info'>
						{t('Ringing')}…
					</Box>
				) : undefined
			}
			subtitle={
				<Box fontScale='micro' color='hint'>
					{t('__count__people_joined', { count: call.usersCount })}
				</Box>
			}
			actions={actions}
		/>
	);
};

export default CallListItem;
