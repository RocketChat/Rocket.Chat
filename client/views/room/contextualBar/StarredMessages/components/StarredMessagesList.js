import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import { Message } from './Message';

export const StarredMessagesList = ({
	messages,
	rid,
	subscription,
	settings,
	u,
}) => {
	// console.log(messages);
	// console.log(settings);
	// console.log(subscription);
	const content = messages.map((msg, idx) =>
		<Message
			key={idx}
			msg={msg}
			context='starred'
			room={rid}
			groupable={false}
			subscription={subscription}
			settings={settings}
			u={u}
		/>);

	return	<Box is='ul' className='messages-box'>
		{content}
	</Box>;
};
