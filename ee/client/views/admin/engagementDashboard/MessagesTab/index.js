import { Divider } from '@rocket.chat/fuselage';
import React from 'react';

import MessagesPerChannelSection from './MessagesPerChannelSection';
import MessagesSentSection from './MessagesSentSection';

const MessagesTab = () => (
	<>
		<MessagesSentSection />
		<Divider />
		<MessagesPerChannelSection />
	</>
);

export default MessagesTab;
