import React from 'react';
import { UiKitMessage as uiKitMessage, kitContext, UiKitModal as uiKitModal, messageParser, modalParser } from '@rocket.chat/fuselage-ui-kit';

import { renderMessageBody } from '../../../ui-utils/client';
import { useReactiveValue } from '../../../../client/hooks/useReactiveValue';

messageParser.text = ({ text, type } = {}) => {
	if (type !== 'mrkdwn') {
		return text;
	}

	return <span dangerouslySetInnerHTML={{ __html: renderMessageBody({ msg: text }) }} />;
};

modalParser.text = messageParser.text;

const contextDefault = {
	action: console.log,
	state: (data) => {
		console.log('state', data);
	},
};
export const messageBlockWithContext = (context) => (props) => {
	const data = useReactiveValue(props.data);
	return (<kitContext.Provider value={context}>
		{uiKitMessage(data)}
	</kitContext.Provider>);
};
export const modalBlockWithContext = (context) => (props) => {
	const { view } = useReactiveValue(props.data);
	return (<kitContext.Provider value={context}>
		{uiKitModal(view)}
	</kitContext.Provider>);
};

export const MessageBlock = (props, context = contextDefault) => (
	<kitContext.Provider value={context}>
		{uiKitMessage(props)}
	</kitContext.Provider>
);
