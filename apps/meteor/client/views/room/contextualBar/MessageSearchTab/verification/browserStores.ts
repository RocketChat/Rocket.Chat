import type { IMessage } from '@rocket.chat/core-typings';

const records = new Map<string, Pick<IMessage, 'u'>>([
	['message', { u: { _id: 'alice', username: 'alice', name: 'Alice Doe' } }],
	['file', { u: { _id: 'bob', username: 'bob', name: 'Bob Smith' } }],
	['reply', { u: { _id: 'carol', username: 'carol', name: 'Carol Jones' } }],
]);
export const Messages = {
	state: { find: () => undefined },
	use: <T>(selector: (state: { records: typeof records }) => T) => selector({ records }),
};
const users = new Map([...records.values()].map(({ u }) => [u._id, u]));
export const Users = {
	state: { find: () => undefined },
	use: <T>(selector: (state: { records: typeof users }) => T) => selector({ records: users }),
};
