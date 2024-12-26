import DiscussionsListItem from './DiscussionsListItem';

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
	title: 'Room/Contextual Bar/Discussion/DiscussionsListItem',
	component: DiscussionsListItem,
};

export const Basic = () => <DiscussionsListItem {...(message as any)} />;

export const LargeText = () => <DiscussionsListItem {...(largeText as any)} />;

export const NoReplies = () => <DiscussionsListItem {...(noReplies as any)} />;
