import React from 'react';
import { Divider } from '@rocket.chat/fuselage';

import MessagesSentSection from './MessagesSentSection';
import MessagesPerChannelSection from './MessagesPerChannelSection';

const MessagesTab = () => <>
	<MessagesSentSection />
	<Divider />
	<MessagesPerChannelSection />
</>;

export default MessagesTab;
