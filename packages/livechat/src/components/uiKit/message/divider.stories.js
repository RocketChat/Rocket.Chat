import { renderMessageBlocks } from '.';

export default {
	title: 'UiKit/Message/Divider block',
	parameters: {
		layout: 'centered',
	},
	decorators: [(storyFn) => <div children={storyFn()} style={{ width: '100vw', maxWidth: 500 }} />],
};

export const Default = () =>
	renderMessageBlocks([
		{
			type: 'divider',
		},
	]);
Default.storyName = 'default';
