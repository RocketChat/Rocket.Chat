import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { isRingingVideoConferenceMember } from '@rocket.chat/core-typings';
import { Box, Icon, IconButton } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import OngoingCallItem from './OngoingCallItem';
import { useOngoingCalls } from '../../context/OngoingCallsContext';
import { canDeclineCall } from '../../lib/constants';

type CallListItemProps = {
	call: JoinableVideoConference;
};

/**
 * One call in the list, whatever state it is in: ringing, merely running, already joined, or turned down.
 *
 * The state is read off the call rather than chosen by the caller, because it is the same row either way — and
 * only the two slots at its edges differ. A list that had to pick a component per state ended up re-deriving
 * that state to do the picking.
 */
const CallListItem = ({ call }: CallListItemProps) => {
	const { t } = useTranslation();
	const { joinCall, declineCall, callRing, callHref, formatTime } = useOngoingCalls();

	// Whether this client is the one making the noise is not a fact about the call — a ring can be sounding on
	// another of this user's sessions — so the row asks about its own call rather than searching a list.
	const { audible, silenced, silence } = callRing(call.callId);

	// Answering ends the ringing presentation, whichever way it was answered — the same rule the list buckets
	// by, and the reason a declined call keeps its place saying so rather than appearing to ring on.
	//
	// The window alone can't tell: `isRingingVideoConferenceMember` suppresses a ring the member declined by
	// comparing `declinedAt` against `ringingAt`, and the joinable payload carries no `declinedAt` — so a call
	// declined a second into its ring would otherwise still read as ringing here for the rest of the window.
	const ringing = !call.declined && !call.joined && isRingingVideoConferenceMember({ ringingAt: call.ringingAt });

	const decline = (
		<IconButton mini secondary icon='cross' title={t('Decline')} aria-label={t('Decline')} onClick={() => declineCall(call.callId)} />
	);

	const actions = (() => {
		if (ringing) {
			return (
				<>
					{silenced && <Icon name='bell-off' size='x16' color='hint' title={t('Incoming_call_silenced')} />}
					{audible && <IconButton mini secondary icon='bell-off' title={t('Silence')} aria-label={t('Silence')} onClick={silence} />}
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
		<OngoingCallItem
			href={callHref(call.callId)}
			onOpen={() => joinCall(call.callId)}
			icon={<Icon name='video' size='x16' />}
			title={call.name}
			time={
				ringing ? (
					<Box is='span' color='info'>
						{t('Ringing')}…
					</Box>
				) : (
					call.createdAt && formatTime(call.createdAt)
				)
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
