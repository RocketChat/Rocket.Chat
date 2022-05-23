/* eslint-disable complexity */
import { IMessage } from '@rocket.chat/core-typings';
import React, { FC, memo } from 'react';

import ASTThreadPreviewRender from '../../../../components/Message/MessageBodyRender/ThreadPreviewRender/ASTThreadPreviewRender';
import { useParsedMessage } from '../hooks/useParsedMessage';

const ThreadPreviewBody: FC<{ message: IMessage }> = ({ message }) => {
	const tokens = useParsedMessage(message);

	return <ASTThreadPreviewRender mentions={message?.mentions || []} channels={message?.channels || []} tokens={tokens} />;
};

export default memo(ThreadPreviewBody);
