import { renderMessageBlocks } from '.';
import accessoryImage from '../../../../.storybook/assets/accessoryImage.png';

export default {
	title: 'UiKit/Message/Context block',
	parameters: {
		layout: 'centered',
	},
	decorators: [
		(storyFn) => <div children={storyFn()} style={{ width: '100vw', maxWidth: 500 }} />,
	],
};

export const PlainText = () =>
	renderMessageBlocks([
		{
			type: 'context',
			elements: [
				{
					type: 'plain_text',
					text: 'Author: Manuel Puig',
					emoji: true,
				},
			],
		},
	]);
PlainText.storyName = 'plain_text';

export const Mrkdwn = () =>
	renderMessageBlocks([
		{
			type: 'context',
			elements: [
				{
					type: 'image',
					imageUrl: accessoryImage,
					altText: 'Photo by Julian Schultz on Unsplash',
				},
				{
					type: 'mrkdwn',
					text: '*Julian Schultz* has approved this message.',
				},
			],
		},
	]);
Mrkdwn.storyName = 'mrkdwn';

export const TextAndImages = () =>
	renderMessageBlocks([
		{
			type: 'context',
			elements: [
				{
					type: 'mrkdwn',
					text: '*This* is :smile: markdown',
				},
				{
					type: 'image',
					imageUrl: accessoryImage,
					altText: 'Photo by Julian Schultz on Unsplash',
				},
				{
					type: 'image',
					imageUrl: accessoryImage,
					altText: 'Photo by Julian Schultz on Unsplash',
				},
				{
					type: 'image',
					imageUrl: accessoryImage,
					altText: 'Photo by Julian Schultz on Unsplash',
				},
				{
					type: 'plain_text',
					text: 'Author: Manuel Puig',
					emoji: true,
				},
			],
		},
	]);
TextAndImages.storyName = 'text and images';
