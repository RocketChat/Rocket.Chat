import { Skeleton, MessageMetricsItemAvatarRowContent } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import React from 'react';

import { useUserInfoQuery } from '../../../hooks/useUserInfoQuery';

const ThreadMetricAvatar = ({ userId }: { userId: string }) => {
	const { data, isLoading } = useUserInfoQuery({ userId, fields: JSON.stringify({ username: 1, avatarETag: 1 }) });

	if (isLoading || !data?.user.username) {
		return (
			<MessageMetricsItemAvatarRowContent>
				<Skeleton variant='rect' size={16} />
			</MessageMetricsItemAvatarRowContent>
		);
	}

	return (
		<MessageMetricsItemAvatarRowContent>
			<UserAvatar size='x16' username={data.user.username} etag={data.user.avatarETag} />
		</MessageMetricsItemAvatarRowContent>
	);
};

export default ThreadMetricAvatar;
