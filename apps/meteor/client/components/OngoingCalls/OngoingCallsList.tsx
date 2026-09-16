import { Box, Button, Divider } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import CallListItem from './CallListItem';
import { useOngoingCalls } from './useOngoingCalls';

const MAX_VISIBLE = 5;

const OngoingCallsList = () => {
	const { t } = useTranslation();
	const { ringing, ongoing, declined, joinCall, decline, silence, silencedCalls, showAll, toggleShowAll } = useOngoingCalls();

	const active = [...ringing, ...ongoing];
	const total = active.length + declined.length;

	const visibleActive = showAll ? active : active.slice(0, MAX_VISIBLE);
	const remainingSlots = Math.max(0, MAX_VISIBLE - visibleActive.length);
	const visibleDeclined = showAll ? declined : declined.slice(0, remainingSlots);

	// Everything the control would reveal, declined calls included — counting only the active ones left it saying
	// "Show all" with no number in the one case where the cap is what hid a declined call.
	const hidden = total - (visibleActive.length + visibleDeclined.length);

	const showAllLabel = hidden > 0 ? t('Show_all_count_new', { count: hidden }) : t('Show_all');

	return (
		<Box display='flex' flexDirection='column'>
			{/* Two lists rather than one with a rule through it. An `<hr>` between items is not a list item, so it
			    was invalid where it stood — and hiding it from a reader left both groups announced as one list, with
			    nothing to say that the calls below it had already been turned down. Each group names itself. */}
			{visibleActive.length > 0 && (
				<Box is='ul' aria-label={t('Ongoing_calls')} display='flex' flexDirection='column' margin={0} paddingBlock={0} paddingInline={0}>
					{visibleActive.map((item) => (
						<Box is='li' key={item.callId}>
							<CallListItem
								call={item}
								silenced={silencedCalls.includes(item.callId)}
								onJoin={joinCall}
								onDecline={decline}
								onSilence={silence}
							/>
						</Box>
					))}
				</Box>
			)}

			{visibleDeclined.length > 0 && (
				<>
					{visibleActive.length > 0 && <Divider aria-hidden='true' />}
					<Box is='ul' aria-label={t('Declined')} display='flex' flexDirection='column' margin={0} paddingBlock={0} paddingInline={0}>
						{visibleDeclined.map((item) => (
							<Box is='li' key={item.callId}>
								<CallListItem call={item} onJoin={joinCall} onDecline={decline} />
							</Box>
						))}
					</Box>
				</>
			)}

			{/* Outside the lists: it is a control over them, not a call in them, and counting it as one told a
			    reader there was one more call than there is.

			    On `total`, not on `showAll`: a list that was expanded and has since shrunk to five or fewer has
			    nothing left to collapse, and went on offering "Show fewer" anyway. */}
			{total > MAX_VISIBLE && (
				<Box paddingInline={16} paddingBlock={4}>
					<Button small secondary width='100%' onClick={toggleShowAll}>
						{showAll ? t('Show_fewer') : showAllLabel}
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default OngoingCallsList;
