import { Divider } from '@rocket.chat/fuselage';
import React from 'react';

import { MessagesSentSection } from './MessagesSentSection';
import { MessagesPerChannelSection } from './MessagesPerChannelSection';

export function MessagesTab() {
	return <>
		<MessagesSentSection />
		<Divider />
		<MessagesPerChannelSection />
	</>;
}
