import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { useSearchParameter } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef } from 'react';

import { setMessageJumpQueryStringParameter } from '../../../../../lib/utils/setMessageJumpQueryStringParameter';

/**
 * The message the thread list jumps to, from the `msg` search parameter. A reply that is not loaded gets the replies around
 * it loaded.
 */
export const useThreadJumpTarget = (
	mainMessage: IThreadMainMessage,
	messages: readonly IMessage[],
	{ isLoading, loadMessageAround }: { isLoading: boolean; loadMessageAround: (messageId: IMessage['_id']) => Promise<unknown> },
) => {
	const messageJumpParam = useSearchParameter('msg');
	const isTargetLoaded = !!messageJumpParam && messages.some(({ _id }) => _id === messageJumpParam);
	const requestedTargetRef = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (!messageJumpParam || isLoading || isTargetLoaded || messageJumpParam === mainMessage._id) {
			return;
		}
		const request = `${mainMessage._id}:${messageJumpParam}`;
		if (requestedTargetRef.current === request) {
			return;
		}
		requestedTargetRef.current = request;
		loadMessageAround(messageJumpParam).catch(() => {
			requestedTargetRef.current = undefined;
		});
	}, [messageJumpParam, isLoading, isTargetLoaded, mainMessage._id, loadMessageAround]);

	const onTargetMessageReached = useCallback(
		(messageId: IMessage['_id']) => {
			if (messageId === messageJumpParam && messageId !== mainMessage._id) {
				setMessageJumpQueryStringParameter(null);
			}
		},
		[messageJumpParam, mainMessage._id],
	);

	return { targetMessageId: messageJumpParam, onTargetMessageReached };
};
