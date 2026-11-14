import type { IMessage, IThreadMainMessage } from '@rocket.chat/core-typings';
import { useSearchParameter } from '@rocket.chat/ui-contexts';
import { useCallback, useEffect, useRef } from 'react';

import { setMessageJumpQueryStringParameter } from '../../../../../lib/utils/setMessageJumpQueryStringParameter';

/**
 * The message the thread list jumps to, from the `msg` search parameter. A message that is not loaded gets the replies around it
 * loaded, once per link; a link that cannot be loaded is dropped, unless the link, the thread or the list has changed since, so
 * following it again asks again. The main message is never cleared here.
 */
export const useThreadJumpTarget = (
	mainMessage: IThreadMainMessage,
	messages: readonly IMessage[],
	{ isLoading, loadMessageAround }: { isLoading: boolean; loadMessageAround: (messageId: IMessage['_id']) => Promise<unknown> },
) => {
	const messageJumpParam = useSearchParameter('msg');
	const isTargetLoaded = !!messageJumpParam && messages.some(({ _id }) => _id === messageJumpParam);
	const requestedTargetRef = useRef<{ key: string } | undefined>(undefined);

	// A request belongs to one link in one thread while the list lasts: a late answer to it decides nothing once any of them changed
	useEffect(
		() => () => {
			requestedTargetRef.current = undefined;
		},
		[messageJumpParam, mainMessage._id],
	);

	useEffect(() => {
		if (!messageJumpParam || isLoading || isTargetLoaded) {
			return;
		}
		const key = `${mainMessage._id}:${messageJumpParam}`;
		if (requestedTargetRef.current?.key === key) {
			return;
		}
		const request = { key };
		requestedTargetRef.current = request;
		void loadMessageAround(messageJumpParam).catch(() => {
			if (requestedTargetRef.current === request && messageJumpParam !== mainMessage._id) {
				void setMessageJumpQueryStringParameter(null);
			}
		});
	}, [messageJumpParam, isLoading, isTargetLoaded, mainMessage._id, loadMessageAround]);

	const onTargetMessageReached = useCallback(
		(messageId: IMessage['_id']) => {
			requestedTargetRef.current = undefined;
			if (messageId === messageJumpParam && messageId !== mainMessage._id) {
				void setMessageJumpQueryStringParameter(null);
			}
		},
		[messageJumpParam, mainMessage._id],
	);

	return { targetMessageId: messageJumpParam, onTargetMessageReached };
};
