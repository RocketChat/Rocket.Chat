import { IMessage } from '@rocket.chat/core-typings';
import { PreviewMarkup } from '@rocket.chat/gazzodown';
import React, { ReactElement } from 'react';

import { useParsedMessage } from '../hooks/useParsedMessage';

type ThreadMessagePreviewBodyProps = {
	message: IMessage;
};

const ThreadMessagePreviewBody = ({ message }: ThreadMessagePreviewBodyProps): ReactElement => {
	const tokens = useParsedMessage(message);

	return <PreviewMarkup tokens={tokens} />;
};

export default ThreadMessagePreviewBody;
