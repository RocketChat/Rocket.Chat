import { Accordion } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import Page from '../../components/Page';
import { MessageWithMdEnforced } from '../room/MessageList/lib/parseMessageTextToAstMarkdown';
import Header from './components/Header';
import MessageList from './components/MessageList';
import { useUnreads } from './hooks/useUnreads';

const UnreadsPage: FC = () => {
	const [loading, error, unreads] = useUnreads();

	if (loading) {
		console.log('loading...', Date.now());
	} else if (error) {
		console.error(error);
	} else {
		console.log('Unreads', unreads, Date.now());
	}

	function getTotalMessages(unread: any): any {
		const lastThread = unread?.threads?.length ? unread?.threads[0]?.messages.slice(-1)[0] : {};
		const messages = unread?.messages
			? unread.messages?.map((msg: MessageWithMdEnforced) => {
					if (msg._id === lastThread?._id) {
						return { ...lastThread, isThreadMessage: true };
					}
					return { ...msg, isThreadMessage: false };
			  })
			: [];
		return messages;
	}

	return (
		<Page.ScrollableContentWithShadow>
			{unreads.map((unread) => (
				<Accordion.Item key={unread._id} title={<Header room={unread} />}>
					<MessageList rid={unread._id} messages={getTotalMessages(unread)} />
				</Accordion.Item>
			))}
		</Page.ScrollableContentWithShadow>
	);
};

export default UnreadsPage;
