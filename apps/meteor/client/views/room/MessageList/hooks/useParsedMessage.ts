import { IMessage } from '@rocket.chat/core-typings';
import { MarkdownAST, parser } from '@rocket.chat/message-parser';
import { useMemo } from 'react';

export function useParsedMessage(message: IMessage): MarkdownAST {
	return useMemo(() => {
		if (message.md) {
			return message.md;
		}
		if (!message.msg) {
			return [];
		}
		return parser(message.msg);
	}, [message]);
}
