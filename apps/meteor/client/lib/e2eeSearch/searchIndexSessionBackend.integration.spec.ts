import type { IMessage } from '@rocket.chat/core-typings';
import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { createSearchIndexSessionBackend } from './searchIndexSessionBackend';
import { createSearchIndexWriter } from './searchIndexWriter';

it('does not send an old decrypt or queued write into a new handle of the same raw backend', async () => {
	const upsert = jest.fn(async (_docs: Parameters<ISearchIndexBackend['upsert']>[0]) => undefined);
	const raw = { upsert } as unknown as ISearchIndexBackend;
	const first = createSearchIndexSessionBackend(raw);
	let active = first.backend;
	const writer = createSearchIndexWriter({ getBackend: () => active });
	const message = (id: string): IMessage =>
		({
			_id: id,
			rid: 'r1',
			t: 'e2e',
			e2e: 'done',
			msg: 'needle',
			u: { _id: 'u1', username: 'alice' },
			ts: new Date(1000),
			_updatedAt: new Date(1000),
		}) as IMessage;
	try {
		const oldDecrypt = writer.bindToOpenIndex();
		writer.index(message('queued-old'));
		first.revoke();
		active = createSearchIndexSessionBackend(raw).backend;
		oldDecrypt(message('decrypted-old'));
		writer.index(message('current'));
		await writer.flush({ throwOnError: true });
		expect(upsert).toHaveBeenCalledTimes(1);
		expect(upsert.mock.calls[0][0].map(({ id }) => id)).toEqual(['current']);
	} finally {
		writer.dispose();
	}
});
