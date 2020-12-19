import { useCallback, useMemo } from 'react';
import produce, { enableAllPlugins } from 'immer';

import { IMessage } from '../../../../../../definition/IMessage';
import { useAsyncState } from '../../../../../hooks/useAsyncState';

enableAllPlugins();

export type MessageMap = Map<IMessage['_id'], IMessage>;

export type MessageList = {
	messages: IMessage[] | undefined;
	error?: Error;
	update: (mutation: (prev: MessageMap) => Promise<void>) => void;
};

const compareMessages = (a: IMessage, b: IMessage): number =>
	b.ts.getTime() - a.ts.getTime();

export const useMessageList = (): MessageList => {
	const mapState = useAsyncState<MessageMap>();

	const { value, error, mutate } = mapState;

	const messages = useMemo(() => {
		if (!value) {
			return undefined;
		}

		return Array.from(value.values()).sort(compareMessages);
	}, [value]);

	const update = useCallback((mutation: (prev: MessageMap) => Promise<void>): void => {
		mutate((prev) => produce(prev ?? new Map(), mutation));
	}, [mutate]);

	return {
		messages,
		error,
		update,
	};
};
