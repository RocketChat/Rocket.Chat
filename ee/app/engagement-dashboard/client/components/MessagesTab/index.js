import { Divider } from '@rocket.chat/fuselage';
import React from 'react';

import { MessagesSentSection } from './MessagesSentSection';
import { MessagesPerChannelSection } from './MessagesPerChannelSection';
import { MessagesAndReactionsSection } from './MessagesAndReactionsSection';

export function MessagesTab() {
	return <>
		<MessagesSentSection />
		<Divider />
		<MessagesPerChannelSection />
		<Divider />
		<MessagesAndReactionsSection />
	</>;
}
