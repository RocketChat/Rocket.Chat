import type { JoinableVideoConference } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from 'react-i18next';

type CallParticipantsProps = Pick<JoinableVideoConference, 'participants' | 'usersCount'>;

/**
 * Who is already in the call, as faces rather than a number.
 *
 * The server sends a few of them and the whole count, so what is left over becomes a "+3" at the end. Faces say
 * *who* is in there, which is usually the thing that decides whether to join; the count alone never did.
 *
 * The group carries the count as its label, so the number is still there for anyone who cannot see the avatars.
 */
const CallParticipants = ({ participants, usersCount }: CallParticipantsProps) => {
	const { t } = useTranslation();

	const label = t('__count__people_in_the_call', { count: usersCount });

	// Nothing to show faces from — an older server, or a call whose members didn't travel with it.
	if (!participants?.length) {
		return (
			<Box fontScale='micro' color='hint'>
				{label}
			</Box>
		);
	}

	const remaining = usersCount - participants.length;

	return (
		<Box display='flex' alignItems='center' aria-label={label} title={label}>
			{participants.map(({ _id, username }, index) => (
				// Overlapped a little, so a row of faces reads as one group rather than a list.
				<Box key={_id} marginInlineStart={index === 0 ? 0 : -4}>
					<UserAvatar username={username} size='x18' />
				</Box>
			))}
			{/* Beside the faces rather than overlapping them: a number tucked under an avatar is a number you have
			    to guess at. It grows with its digits, too — there can be a lot of people in a call. */}
			{remaining > 0 && (
				<Box
					marginInlineStart={4}
					minWidth='x18'
					height='x18'
					paddingInline={4}
					display='flex'
					alignItems='center'
					justifyContent='center'
					borderRadius='x4'
					backgroundColor='surface-neutral'
					color='hint'
					fontScale='micro'
				>
					{`+${remaining}`}
				</Box>
			)}
		</Box>
	);
};

export default CallParticipants;
