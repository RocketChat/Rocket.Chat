import { useMemo } from 'react';
import { Meteor } from 'meteor/meteor';

import { useReactiveValue } from './useReactiveValue';
import { getUserAvatarURL } from '../../app/utils/lib/getUserAvatarURL';

export const useAvatarUrlFromUserId = (userId) => {
	const user = useReactiveValue(() => Meteor.users.findOne({ _id: userId }, { fields: { username: 1, avatarETag: 1 } }), [userId]);

	const { username, avatarETag } = user;

	return useMemo(() => [username, getUserAvatarURL(username, avatarETag)], [username, avatarETag]);
};
