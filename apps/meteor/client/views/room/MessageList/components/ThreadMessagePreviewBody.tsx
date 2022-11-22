import { IMessage } from '@rocket.chat/core-typings';
import { PreviewMarkup } from '@rocket.chat/gazzodown';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useAutoTranslate } from '../hooks/useAutoTranslate';
import { parseMessageTextToAstMarkdown } from '../lib/parseMessageTextToAstMarkdown';

type ThreadMessagePreviewBodyProps = {
	message: IMessage;
};

const ThreadMessagePreviewBody = ({ message }: ThreadMessagePreviewBodyProps): ReactElement => {
	const subscription = useUserSubscription(message.rid);
	const autoTranslateOptions = useAutoTranslate(subscription);
	const parsedMessage = parseMessageTextToAstMarkdown(message, { colors: true, emoticons: true }, autoTranslateOptions);

	return parsedMessage.md ? <PreviewMarkup tokens={parsedMessage.md} /> : <></>;
};

export default ThreadMessagePreviewBody;
