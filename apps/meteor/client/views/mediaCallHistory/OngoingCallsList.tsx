import { Box, Button, Tag } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { useJoinCall } from '../conference/hooks/useJoinCall';
import { useJoinableCalls } from '../conference/hooks/useJoinableCalls';

/**
 * The calls that are still running, above the record of ones that finished.
 *
 * This is the way back into a call the user declined: declining quiets the sidebar, so without this a change of
 * mind a moment later would have nowhere to go. Declined calls are therefore kept here — marked, not hidden —
 * which is the one way this list differs from the sidebar's.
 *
 * A history row means "a call that happened", and these haven't finished; keeping them a separate section rather
 * than rows in the table is what preserves that.
 */
const OngoingCallsList = () => {
	const { t } = useTranslation();
	const joinCall = useJoinCall();
	const { calls } = useJoinableCalls();

	if (!calls.length) {
		return null;
	}

	return (
		<Box marginBlockEnd={16}>
			<Box is='h3' fontScale='h5' color='default' marginBlockEnd={8}>
				{t('Ongoing_calls')}
			</Box>
			{calls.map((call) => (
				<Box
					key={call.callId}
					display='flex'
					alignItems='center'
					justifyContent='space-between'
					paddingInline={12}
					paddingBlock={8}
					marginBlockEnd={4}
					borderRadius='x4'
					backgroundColor='surface-tint'
				>
					<Box display='flex' alignItems='center' minWidth={0}>
						<Box fontScale='p2m' color='default' withTruncatedText>
							{call.name}
						</Box>
						{call.declined && (
							<Box marginInlineStart={8}>
								<Tag>{t('Declined')}</Tag>
							</Box>
						)}
						<Box marginInlineStart={8} fontScale='c1' color='hint'>
							{t('__count__people_in_the_call', { count: call.usersCount })}
						</Box>
					</Box>
					{!call.joined && (
						<Button small primary onClick={() => joinCall(call.callId)}>
							{t('Join')}
						</Button>
					)}
				</Box>
			))}
		</Box>
	);
};

export default OngoingCallsList;
