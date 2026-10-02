import type { IRoom } from '@rocket.chat/core-typings';
import {
	MessageMetricsItem,
	MessageMetricsItemLabel,
	MessageMetricsItemAvatarRow,
	MessageMetricsItemIcon,
	MessageMetricsItemAvatarRowContent,
} from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint, useUserPreference, useUserSubscription } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { roomsQueryKeys } from '../../../lib/queryKeys';

const VISIBLE_AVATARS = 2;

// The members list answers 404 when the user can't access the discussion. 401 isn't treated as "no access" because it
// also means an expired session.
const isNoAccessError = (error: unknown) =>
	typeof error === 'object' && error !== null && 'status' in error && (error.status === 403 || error.status === 404);

export type DiscussionMetricsParticipantsProps = {
	drid: IRoom['_id'];
};

const DiscussionMetricsParticipants = ({ drid }: DiscussionMetricsParticipantsProps) => {
	const { t } = useTranslation();

	const hideAvatar = !useUserPreference('displayAvatars');

	// Refetch when the user joins or leaves the discussion
	const isMember = !!useUserSubscription(drid);

	const getMembers = useEndpoint('GET', '/v1/rooms.membersOrderedByRole');
	const { data } = useQuery({
		queryKey: [...roomsQueryKeys.discussionParticipants(drid), isMember],
		// Users who can't see the discussion's members simply get no avatar stack. Resolving instead of failing keeps that
		// result cached, so it isn't requested again on every remount; any other failure still errors and can be retried.
		queryFn: async () => {
			try {
				return await getMembers({ roomId: drid, count: VISIBLE_AVATARS });
			} catch (error) {
				if (isNoAccessError(error)) {
					return null;
				}
				throw error;
			}
		},
		staleTime: 60_000,
		retry: 1,
	});

	if (!data?.total) {
		return null;
	}

	const hiddenCount = data.total - data.members.length;

	return (
		<MessageMetricsItem title={t('__count__members', { count: data.total })}>
			{hideAvatar && (
				<>
					<MessageMetricsItemIcon name='user' />
					<MessageMetricsItemLabel>{data.total}</MessageMetricsItemLabel>
				</>
			)}
			{!hideAvatar && (
				<>
					<MessageMetricsItemAvatarRow role='img' aria-label={t('__count__members', { count: data.total })}>
						{data.members.map(({ _id }) => (
							<MessageMetricsItemAvatarRowContent key={_id}>
								<UserAvatar size='x16' userId={_id} />
							</MessageMetricsItemAvatarRowContent>
						))}
					</MessageMetricsItemAvatarRow>
					{hiddenCount > 0 && <MessageMetricsItemLabel>{`+${hiddenCount}`}</MessageMetricsItemLabel>}
				</>
			)}
		</MessageMetricsItem>
	);
};

export default DiscussionMetricsParticipants;
