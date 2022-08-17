import { renderMessageBlocks } from '.';
import imageBlock from '../../../../.storybook/assets/imageBlock.png';

export default {
	title: 'UiKit/Message/Image block',
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(storyFn) => <div children={storyFn()} style={{ width: '100vw', maxWidth: 500 }} />,
	],
};

export const WithTitle = () =>
	renderMessageBlocks([
		{
			type: 'image',
			title: {
				type: 'plain_text',
				text: 'SpaceX Falcon Heavy Launch',
				emoji: true,
			},
			imageUrl: imageBlock,
			altText: 'Photo by SpaceX on Unsplash',
		},
	]);
WithTitle.storyName = 'with title';

export const WithNoTitle = () =>
	renderMessageBlocks([
		{
			type: 'image',
			imageUrl: imageBlock,
			altText: 'Photo by SpaceX on Unsplash',
		},
	]);
WithNoTitle.storyName = 'with no title';
