import { IMessage } from '@rocket.chat/core-typings';
import { MarkdownAST, parser } from '@rocket.chat/message-parser';
import { useMemo } from 'react';

export function useParsedMessage(message: IMessage['msg']): MarkdownAST {
	return useMemo(() => parser(message), [message]);
}
