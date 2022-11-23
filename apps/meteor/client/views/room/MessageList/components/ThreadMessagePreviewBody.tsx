import { IMessage } from '@rocket.chat/core-typings';
import { PreviewMarkup } from '@rocket.chat/gazzodown';
import React, { ReactElement } from 'react';

type ThreadMessagePreviewBodyProps = {
	message: IMessage;
};

const ThreadMessagePreviewBody = ({ message }: ThreadMessagePreviewBodyProps): ReactElement =>
	message.md ? <PreviewMarkup tokens={message.md} /> : <></>;

export default ThreadMessagePreviewBody;
