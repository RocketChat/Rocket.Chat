import { IMessage } from '@rocket.chat/core-typings';
import { PreviewMarkup } from '@rocket.chat/gazzodown';
import React, { ReactElement } from 'react';

import { parseMessage } from '../lib/parseMessage';

type ThreadMessagePreviewBodyProps = {
	message: IMessage;
};

const ThreadMessagePreviewBody = ({ message }: ThreadMessagePreviewBodyProps): ReactElement => {
	const parsedMessage = parseMessage(message, { colors: true, emoticons: true });

	return parsedMessage.md ? <PreviewMarkup tokens={parsedMessage.md} /> : <></>;
};

export default ThreadMessagePreviewBody;
