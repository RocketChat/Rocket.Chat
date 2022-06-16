import { IMessage } from '@rocket.chat/core-typings';
import React, { ReactElement } from 'react';

import PreviewMarkup from '../../../../components/gazzodown/PreviewMarkup';
import { useParsedMessage } from '../hooks/useParsedMessage';

type ThreadMessagePreviewBodyProps = {
	message: IMessage;
};

const ThreadMessagePreviewBody = ({ message }: ThreadMessagePreviewBodyProps): ReactElement => {
	const tokens = useParsedMessage(message);

	return <PreviewMarkup tokens={tokens} />;
};

export default ThreadMessagePreviewBody;
