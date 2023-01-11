import type { IMessage } from '@rocket.chat/core-typings';
import { PreviewMarkup } from '@rocket.chat/gazzodown';
import type { ReactElement } from 'react';
import React from 'react';

type ThreadMessagePreviewBodyProps = {
	message: IMessage;
};

const ThreadMessagePreviewBody = ({ message }: ThreadMessagePreviewBodyProps): ReactElement => {
	return message.md ? <PreviewMarkup tokens={message.md} /> : <>{message.msg}</>;
};

export default ThreadMessagePreviewBody;
