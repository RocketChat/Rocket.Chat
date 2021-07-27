import React from 'react';

import Message from './Message';

const message = {
	msg: 'hello world',
	ts: new Date(0),
	username: 'guilherme.gazzo',
	dcount: 5,
	dlm: new Date(0).toISOString(),
};

const largeText = {
	...message,
	msg: 'Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text',
};

const noReplies = {
	...message,
	dcount: 0,
};

export default {
	title: 'components/Discussion/Message',
	component: Message,
};

export const Basic = () => <Message {...message} />;

export const LargeText = () => <Message {...largeText} />;

export const NoReplies = () => <Message {...noReplies} />;
