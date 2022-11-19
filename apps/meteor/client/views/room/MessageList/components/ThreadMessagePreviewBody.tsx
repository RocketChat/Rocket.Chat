import { IMessage } from '@rocket.chat/core-typings';
import { MarkupInteractionContext, PreviewMarkup } from '@rocket.chat/gazzodown';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { parseMessageTextToAstMarkdown } from '../lib/parseMessageTextToAstMarkdown';

import { detectEmoji } from '../../../../lib/detectEmoji';

type ThreadMessagePreviewBodyProps = {
	message: IMessage;
};

const ThreadMessagePreviewBody = ({ message }: ThreadMessagePreviewBodyProps): ReactElement => {
	const parsedMessage = parseMessageTextToAstMarkdown(message, { colors: true, emoticons: true });

	const convertAsciiToEmoji = useUserPreference<boolean>('convertAsciiEmoji', true);

	if (!parsedMessage.md) {
		return <></>;
	}

	return (
		<MarkupInteractionContext.Provider
			value={{
				detectEmoji,
				convertAsciiToEmoji,
			}}
		>
			<PreviewMarkup tokens={parsedMessage.md} />
		</MarkupInteractionContext.Provider>
	)
};

export default ThreadMessagePreviewBody;
