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

	const hasMore = total > MAX_VISIBLE && !showAll;
	const hiddenActive = active.length - visibleActive.length;

	const showAllLabel = hiddenActive > 0 ? t('Show_all_count_new', { count: hiddenActive }) : t('Show_all');

	return (
		// A real list, so the calls are countable and each row is an item of it. It was a bare column of links,
		// which a screen reader reads as loose links with nothing saying how many there are or that they belong
		// together.
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

			{visibleDeclined.length > 0 && (
				<>
					{/* `aria-hidden`, because a separator between two groups of the same list is a picture of the
					    grouping rather than an item in it — and a bare `<hr>` between list items is not one. */}
					{visibleActive.length > 0 && <Divider aria-hidden='true' />}
					{visibleDeclined.map((item) => (
						<Box is='li' key={item.callId}>
							<CallListItem call={item} onJoin={joinCall} onDecline={decline} />
						</Box>
					))}
				</>
			)}

			{(hasMore || showAll) && (
				<Box is='li' paddingInline={16} paddingBlock={4}>
					<Button small secondary width='100%' onClick={toggleShowAll}>
						{showAll ? t('Show_fewer') : showAllLabel}
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default OngoingCallsList;
