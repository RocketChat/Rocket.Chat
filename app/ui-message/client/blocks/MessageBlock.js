import React from 'react';
import { UiKitMessage as uiKitMessage, kitContext, UiKitModal as uiKitModal } from '@rocket.chat/fuselage-ui-kit';

import { useReactiveValue } from '../../../../client/hooks/useReactiveValue';

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
	const data = useReactiveValue(props.data);
	return (<kitContext.Provider value={context}>
		{uiKitModal(data)}
	</kitContext.Provider>);
};

export const MessageBlock = (props, context = contextDefault) => (
	<kitContext.Provider value={context}>
		{uiKitMessage(props)}
	</kitContext.Provider>
);
