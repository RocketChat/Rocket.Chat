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
 * One call in the list, whatever state it is in: ringing, merely running, already joined, or turned down. The
 * state is read off the call rather than chosen by the caller — it is the same row either way.
 */
const CallListItem = ({ call }: CallListItemProps) => {
	const { t } = useTranslation();
	const { joinCall, declineCall, callRing, callHref, formatTime } = useOngoingCalls();

	const { audible, silenced, silence } = callRing(call.callId);

	// `declined` and `joined` are checked here because the joinable payload carries no `declinedAt` for
	// `isRingingVideoConferenceMember` to compare against, so a call declined mid-ring would still read as ringing.
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

		// Kept in the list as the way back in, with nothing left to decline.
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
