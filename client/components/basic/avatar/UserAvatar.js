import React, { useMemo } from 'react';
import { Meteor } from 'meteor/meteor';
import { Avatar } from '@rocket.chat/fuselage';

import { getUserAvatarURL } from '../../../../app/utils/lib/getUserAvatarURL';

const useAvatarUrl = ({ url, username, userId }) => useMemo(() => {
	if (url) {
		return url;
	}

	if (userId) {
		const { username: foundUsername, avatarETag } = Meteor.users.findOne({ _id: userId }, { fields: { username: 1, avatarETag: 1 } });

		return getUserAvatarURL(foundUsername, avatarETag);
	}

	return getUserAvatarURL(username);
}, [url, username, userId]);

function UserAvatar({ url, username, userId, ...props }) {
	const avatarUrl = useAvatarUrl({ url, username, userId });
	return <Avatar url={avatarUrl} title={username} {...props}/>;
}

export default UserAvatar;
