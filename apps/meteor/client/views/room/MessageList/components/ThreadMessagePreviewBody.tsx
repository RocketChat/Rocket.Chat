import type { IMessage } from '@rocket.chat/core-typings';
import { PreviewMarkup } from '@rocket.chat/gazzodown';
import type { ReactElement } from 'react';
import React from 'react';

import { parseMessageTextToAstMarkdown } from '../lib/parseMessageTextToAstMarkdown';

type ThreadMessagePreviewBodyProps = {
	message: IMessage;
};

const ThreadMessagePreviewBody = ({ message }: ThreadMessagePreviewBodyProps): ReactElement => {
	const parsedMessage = parseMessageTextToAstMarkdown(message, { colors: true, emoticons: true });

	return parsedMessage.md ? <PreviewMarkup tokens={parsedMessage.md} /> : <></>;
};

export default ThreadMessagePreviewBody;
