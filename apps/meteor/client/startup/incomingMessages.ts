import type { IMessage } from '@rocket.chat/core-typings';

import { sdk } from '../../app/utils/client/lib/SDKClient';
import { onLoggedIn } from '../lib/loggedIn';
import { getUserId } from '../lib/user';
import { upsertThreadMessageInCache } from '../lib/utils/threadMessageUtils';
import { Messages } from '../stores';

onLoggedIn(() => {
	// Only event I found triggers this is from ephemeral messages
	// Other types of messages come from another stream
	return sdk.stream('notify-user', [`${getUserId()}/message`], (msg: IMessage) => {
		msg.u = msg.u || { username: 'rocket.cat' };
		msg.private = true;

		if (msg.tmid) {
			upsertThreadMessageInCache(msg, msg.rid, msg.tmid);
		}

		return Messages.state.store(msg);
	}).stop;
});

onLoggedIn(() => {
	return sdk.stream('notify-user', [`${getUserId()}/subscriptions-changed`], (_action, sub) => {
		Messages.state.update(
			(record) => record.rid === sub.rid && ('ignored' in sub && sub.ignored ? !sub.ignored.includes(record.u._id) : 'ignored' in record),
			({ ignored: _, ...record }) => record,
		);
		if ('ignored' in sub && sub.ignored) {
			Messages.state.update(
				(record) => record.rid === sub.rid && record.t !== 'command' && (sub.ignored?.includes(record.u._id) ?? false),
				(record) => ({ ...record, ignored: true }),
			);
		}
	}).stop;
});
