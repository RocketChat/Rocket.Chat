import { Box, Button } from '@rocket.chat/fuselage';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import OngoingCallRow from './OngoingCallRow';
import RingingCallItem from './RingingCallItem';
import { useOngoingCalls } from './useOngoingCalls';

/** How many to show before asking. This is a route to a call, not a place to read a list. */
const COLLAPSED_LIMIT = 3;

/**
 * The calls this user can walk into: the one ringing them, and the ones simply running.
 *
 * Every item is something to act on — answer it, join it, or turn it down so it stops asking. The call the reader
 * is *already in* is left out: they are in it, there is nothing to reach, and an item that only said "in call"
 * left them with something they could do nothing about.
 *
 * Rendered in two places, unchanged: docked at the top of the sidebar, and behind the navbar button that appears
 * when the sidebar is not there to dock it in.
 */
const OngoingCalls = () => {
	const { t } = useTranslation();
	const { ringing, ongoing, joinCall, decline, silence, silencedCalls } = useOngoingCalls();
	const [expanded, setExpanded] = useState(false);

	const hidden = ongoing.length - COLLAPSED_LIMIT;
	const shown = expanded ? ongoing : ongoing.slice(0, COLLAPSED_LIMIT);

	// Nothing to reach: render nothing at all, so whatever holds this — a sidebar card, a dropdown — has nothing
	// to wrap either.
	if (!ringing.length && !ongoing.length) {
		return null;
	}

	return (
		<>
			{/* The list can outgrow the space it is docked in — a sidebar, or a dropdown — so it scrolls rather than
			    pushing everything below it off the screen. The toggle stays outside, where it can always be reached. */}
			<Box maxHeight='40vh' overflowY='auto' overflowX='hidden'>
				{/* Above everything else, because these are the only ones asking a question — and said once for the
			    group, the way the ongoing ones are, rather than repeated under every name. */}
				{ringing.length > 0 && (
					<Box fontScale='c1' color='status-font-on-danger' marginBlockEnd={8}>
						{ringing.length === 1 ? t('Incoming_call') : t('Incoming_calls')}
					</Box>
				)}
				{ringing.map((call) => (
					<RingingCallItem
						key={call.callId}
						call={call}
						silenced={silencedCalls.includes(call.callId)}
						onAccept={joinCall}
						onReject={decline}
						onSilence={silence}
					/>
				))}

				{ongoing.length > 0 && (
					<>
						<Box fontScale='c1' color='hint' marginBlockEnd={8}>
							{t('Ongoing_calls')}
						</Box>
						{shown.map((call) => (
							<OngoingCallRow key={call.callId} call={call} onJoin={joinCall} onDecline={decline} />
						))}
					</>
				)}
			</Box>

			{hidden > 0 && (
				<Button small secondary width='100%' onClick={() => setExpanded(!expanded)}>
					{expanded ? t('Show_fewer') : t('Show_all__count__calls', { count: ongoing.length })}
				</Button>
			)}
		</>
	);
};

export default OngoingCalls;
