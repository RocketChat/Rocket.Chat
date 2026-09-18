import type { IUser } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation } from 'react-i18next';

type CallParticipantsProps = {
	/** A few of the people in the call — whoever is to get a face. Capped by the caller. */
	people: (Pick<IUser, '_id'> & Partial<Pick<IUser, 'username'>>)[];
	/** How many are in the call altogether, which is what the count after the faces is worked out from. */
	total: number;
	/** How big the faces are: a row in a list, or a screen with room to spare. */
	size?: 'small' | 'large';
	/** Whether this reader wants faces at all. A prop: this also renders from the start screen, which has no conference. */
	displayAvatars?: boolean;
};

/** Fuselage's `x` scale, which is the union `UserAvatar` accepts; it takes no numbers. */
const AVATAR_SIZES = { small: 'x18', large: 'x24' } as const;

/**
 * Who is already in a call: their faces, then how many more there are — said the way the call's own message
 * block says it, so a call met in the sidebar and again in its room reads the same both times.
 */
const CallParticipants = ({ people, total, size = 'small', displayAvatars = true }: CallParticipantsProps) => {
	const { t } = useTranslation();
	const label = t('__count__people_in_the_call', { count: total });

	// `UserAvatar` renders nothing without a username, which would leave a gap in the row. Counted, not drawn.
	const faces = people.filter(({ username }) => !!username);

	if (!displayAvatars || !faces.length) {
		return (
			<Box fontScale='micro' color='hint'>
				{t('__usersCount__joined', { count: total })}
			</Box>
		);
	}

	const remaining = total - faces.length;

	return (
		// `role='img'`: a generic container's `aria-label` is not announced, and the count is these faces' alt text.
		<Box role='img' display='flex' alignItems='center' aria-label={label} title={label} style={{ gap: 6 }}>
			<Box display='flex' alignItems='center' style={{ gap: 4 }}>
				{faces.map(({ _id, username }) => (
					<UserAvatar key={_id} username={username as string} size={AVATAR_SIZES[size]} />
				))}
			</Box>
			<Box fontScale='micro' color='hint' flexShrink={0}>
				{remaining > 0 ? t('plus__usersCount__joined', { count: remaining }) : t('joined')}
			</Box>
		</Box>
	);
};

export default CallParticipants;
