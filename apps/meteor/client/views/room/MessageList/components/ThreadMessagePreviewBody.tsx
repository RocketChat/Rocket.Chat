import { IMessage } from '@rocket.chat/core-typings';
import React, { ReactElement } from 'react';

import MessageBodyPreview from '../../../../components/message/body/MessageBodyPreview';
import { useParsedMessage } from '../hooks/useParsedMessage';

type ThreadMessagePreviewBodyProps = {
	message: IMessage;
};

const ThreadMessagePreviewBody = ({ message }: ThreadMessagePreviewBodyProps): ReactElement => {
	const tokens = useParsedMessage(message);

	return <MessageBodyPreview tokens={tokens} />;
};

export default ThreadMessagePreviewBody;
