import type { IUser } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

/**
 * A little definition under each face, so a row of them reads as faces rather than as a strip of colour.
 * `drop-shadow` rather than `box-shadow` because it follows the avatar's own rounded shape — the radius belongs to
 * the avatar, and guessing it here would leave a square shadow behind a rounded picture.
 */
const facesStyles = css`
	filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.24)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.32));
`;

type CallParticipantsProps = {
	/** A few of the people in the call — whoever is to get a face. Capped by the caller. */
	people: (Pick<IUser, '_id'> & Partial<Pick<IUser, 'username'>>)[];
	/** How many are in the call altogether, which is what the count after the faces is worked out from. */
	total: number;
	/** Avatar size, since a sidebar row and a full screen don't want the same one. */
	size?: 'x18' | 'x24';
};

/**
 * Who is already in a call: their faces, then how many more there are.
 *
 * Says it the way the call's own message block says it — the faces, then `+ 3 joined`, or just `joined` when they
 * are all shown. Same arrangement and the same phrases (`plus__usersCount__joined`, `joined`), because a call the
 * user meets in the sidebar and again in its room should read the same both times.
 *
 * Faces answer *who* is in there, which is usually what decides whether to walk in. With avatars turned off there
 * is nobody to show, so it falls back to the count in words, as the message block does.
 */
const CallParticipants = ({ people, total, size = 'x18' }: CallParticipantsProps) => {
	const { t } = useTranslation();
	const displayAvatars = useUserPreference<boolean>('displayAvatars');

	// The whole count, as the group's label: it is what a screen reader gets instead of the faces, and "+ 3" only
	// means something next to a total.
	const label = t('__count__people_in_the_call', { count: total });

	// Faces switched off, or a call whose members didn't travel with it — an older server, say.
	if (!displayAvatars || !people.length) {
		return (
			<Box fontScale='micro' color='hint'>
				{t('__usersCount__joined', { count: total })}
			</Box>
		);
	}

	const remaining = total - people.length;

	return (
		<Box display='flex' alignItems='center' aria-label={label} title={label} style={{ gap: 6 }}>
			{/* Side by side with a little air between them, rather than overlapped: there are only ever a few, and
			    a face half behind another face is a worse picture of who is in the call. */}
			<Box display='flex' alignItems='center' style={{ gap: 4 }}>
				{people.map(({ _id, username }) => (
					<Box key={_id} className={facesStyles}>
						<UserAvatar username={username ?? ''} size={size} />
					</Box>
				))}
				{people.length === 1 && <Box aria-hidden='true' width={size} height={size} borderRadius='full' backgroundColor='surface-neutral' />}
			</Box>
			<Box fontScale='micro' color='hint' flexShrink={0}>
				{remaining > 0 ? t('plus__usersCount__joined', { count: remaining }) : t('joined')}
			</Box>
		</Box>
	);
};

export default CallParticipants;
