import type { IThreadMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { useMethod } from '@rocket.chat/ui-contexts';

import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/shallow';

import { upsertMessageBulk } from '../../../../../../app/ui-utils/client/lib/RoomHistoryManager';
import { Messages } from '../../../../../stores';

export const useLegacyThreadMessages = (
	tmid: IThreadMainMessage['_id'],
): {
	messages: Array<IThreadMessage | IThreadMainMessage>;
	loading: boolean;
} => {
	const messages = Messages.use(
		useShallow((state) =>
			state
				.filter(
					(record): record is IThreadMessage =>
						(record.tmid === tmid || record._id === tmid) &&
						record._hidden !== true &&
						record.tmid === tmid &&
						record._id !== tmid &&
						isThreadMessage(record),
				)
				.sort((a, b) => a.ts.getTime() - b.ts.getTime()),
		),
	);

	const [loading, setLoading] = useState(messages.length === 0);

	const getThreadMessages = useMethod('getThreadMessages');

	useEffect(() => {
		getThreadMessages({ tmid })
			.then((messages) => upsertMessageBulk({ msgs: messages }))
			.then(() => {
				setLoading(false);
			});
	}, [getThreadMessages, tmid]);

	return { messages, loading };
};
