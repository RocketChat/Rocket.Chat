import React from 'react';
import { UiKitMessage as uiKitMessage, kitContext, messageParser } from '@rocket.chat/fuselage-ui-kit';

import { renderMessageBody } from '../../../ui-utils/client';
import { useReactiveValue } from '../../../../client/hooks/useReactiveValue';

messageParser.text = ({ text, type } = {}) => {
	if (type !== 'mrkdwn') {
		return text;
	}

	return <span dangerouslySetInnerHTML={{ __html: renderMessageBody({ msg: text }) }} />;
};

const contextDefault = {
	action: console.log,
	state: (data) => {
		console.log('state', data);
	},
};
export const messageBlockWithContext = (context) => (props) => {
	const data = useReactiveValue(props.data);
	return (
		<kitContext.Provider value={context}>
			{uiKitMessage(data.blocks)}
		</kitContext.Provider>
	);
};

export const MessageBlock = ({ blocks }, context = contextDefault) => (
	<kitContext.Provider value={context}>
		{uiKitMessage(blocks)}
	</kitContext.Provider>
);
