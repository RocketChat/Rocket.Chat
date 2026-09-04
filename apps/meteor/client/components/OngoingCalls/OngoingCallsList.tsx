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
		<Box display='flex' flexDirection='column'>
			{visibleActive.map((item) => (
				<CallListItem
					key={item.callId}
					call={item}
					silenced={silencedCalls.includes(item.callId)}
					onJoin={joinCall}
					onDecline={decline}
					onSilence={silence}
				/>
			))}

			{visibleDeclined.length > 0 && (
				<>
					{visibleActive.length > 0 && <Divider />}
					{visibleDeclined.map((item) => (
						<CallListItem key={item.callId} call={item} onJoin={joinCall} onDecline={decline} />
					))}
				</>
			)}

			{(hasMore || showAll) && (
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
