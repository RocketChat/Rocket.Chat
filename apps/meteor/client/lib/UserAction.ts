import { debounce } from 'lodash';

import { sdk } from './SDKClient';
import { createUserAction, USER_ACTIVITIES } from './chats/core/createUserAction';
import { settings } from './settings';
import { getUser, getUserId } from './user';
import { Users } from '../stores';

export { USER_ACTIVITIES };

export const UserAction = createUserAction({
	publish(topic, args) {
		sdk.publish(topic, args);
	},
	stream(topic, args, handler) {
		return sdk.stream(topic, args, handler as (...data: unknown[]) => void);
	},
	useRealName: () => !!settings.peek('UI_Use_Real_Name'),
	getUser,
	getUserId,
	getUserState: (uid) => Users.state.get(uid),
	debounce,
});
