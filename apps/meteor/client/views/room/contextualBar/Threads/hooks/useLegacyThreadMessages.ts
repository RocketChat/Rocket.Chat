import type { IThreadMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { isThreadMessage } from '@rocket.chat/core-typings';
import { useMethod } from '@rocket.chat/ui-contexts';
import { useEffect, useState, useCallback } from 'react';

import { Messages } from '../../../../../../app/models/client';
import { upsertMessageBulk } from '../../../../../../app/ui-utils/client/lib/RoomHistoryManager';
import { useReactiveValue } from '../../../../../hooks/useReactiveValue';

export const useLegacyThreadMessages = (
	tmid: IThreadMainMessage['_id'],
): {
	messages: Array<IThreadMessage | IThreadMainMessage>;
	loading: boolean;
} => {
	const messages = useReactiveValue(
		useCallback(() => {
			return Messages.find(
				{
					$or: [{ tmid }, { _id: tmid }],
					_hidden: { $ne: true },
					tmid,
					_id: { $ne: tmid },
				},
				{
					fields: {
						collapsed: 0,
						threadMsg: 0,
						repliesCount: 0,
					},
					sort: { ts: 1 },
				},
			)
				.fetch()
				.filter(isThreadMessage);
		}, [tmid]),
	);

	const [loading, setLoading] = useState(false);

	const getThreadMessages = useMethod('getThreadMessages');

	useEffect(() => {
		setLoading(true);
		getThreadMessages({ tmid }).then((messages) => {
			upsertMessageBulk({ msgs: messages }, Messages);
			setLoading(false);
		});
	}, [getThreadMessages, tmid]);

	return { messages, loading };
};
