import React from 'react';

import Message from './Message';

const message = {
	msg: 'hello world',
	ts: new Date(0),
	username: 'guilherme.gazzo',
	replies: 1,
	participants: 2,
	tlm: new Date(0).toISOString(),
};

const largeText = {
	...message,
	msg: 'Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text, Large text',
};

const following = {
	...largeText,
	following: true,
};

const unread = {
	...largeText,
	unread: true,
};

const all = {
	...unread,
	all: true,
};

const mention = {
	...all,
	mention: true,
};

export default {
	title: 'Room/Contextual Bar/Threads/Message',
	component: Message,
};

export const Basic = () => <Message {...message} />;

export const LargeText = () => <Message {...largeText} />;

export const Following = () => <Message {...following} />;

export const Unread = () => <Message {...unread} />;

export const Mention = () => <Message {...mention} />;

export const MentionAll = () => <Message {...all} />;
