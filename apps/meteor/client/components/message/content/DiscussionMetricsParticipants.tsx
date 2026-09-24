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
		queryFn: () => getMembers({ roomId: drid, count: VISIBLE_AVATARS }),
		staleTime: 60_000,
		// Users who can't see the discussion's members (e.g. private discussions) simply get no avatar stack.
		retry: false,
	});

	if (!data?.total) {
		return null;
	}

	const hiddenCount = data.total - VISIBLE_AVATARS;

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
					<MessageMetricsItemAvatarRow>
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
