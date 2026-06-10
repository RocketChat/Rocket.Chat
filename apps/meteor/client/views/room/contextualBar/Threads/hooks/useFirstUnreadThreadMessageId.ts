import type { IMessage, IThreadMainMessage, IThreadMessage } from '@rocket.chat/core-typings';
import { useUserId } from '@rocket.chat/ui-contexts';
import { useMemo, useSyncExternalStore } from 'react';

import { threadsReadStateManager } from '../../../../../lib/threadsReadStateManager';
import { getFirstUnreadThreadMessageId } from '../../../../../lib/utils/threadMessageUtils';

export const useFirstUnreadThreadMessageId = (
	tmid: IMessage['_id'],
	items: ReadonlyArray<IThreadMainMessage | IThreadMessage>,
): string | undefined => {
	const userId = useUserId();

	const threadLastRead = useSyncExternalStore(
		(callback) => threadsReadStateManager.onLastReadChange(tmid, callback),
		() => threadsReadStateManager.getLastRead(tmid),
	);

	return useMemo(() => getFirstUnreadThreadMessageId(items, { threadLastRead, userId }), [items, threadLastRead, userId]);
};
