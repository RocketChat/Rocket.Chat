import { Divider } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import MessagesPerChannelSection from './MessagesPerChannelSection';
import MessagesSentSection from './MessagesSentSection';

const MessagesTab = (): ReactElement => (
	<>
		<MessagesSentSection />
		<Divider />
		<MessagesPerChannelSection />
	</>
);

export default MessagesTab;
