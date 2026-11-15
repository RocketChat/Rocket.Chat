import type { Meta, StoryObj } from '@storybook/preact';

import { renderMessageBlocks } from '.';
import { accessoryImage } from '../../../../.storybook/helpers';

export default {
	parameters: {
		layout: 'centered',
	},
	decorators: [(storyFn) => <div style={{ width: '100vw', maxWidth: 500 }}>{storyFn()}</div>],
} satisfies Meta;

export const PlainText: StoryObj = {
	name: 'plain_text',
	render: () => (
		<>
			{renderMessageBlocks([
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
			])}
		</>
	),
};

export const Mrkdwn: StoryObj = {
	name: 'mrkdwn',
	render: () => (
		<>
			{renderMessageBlocks([
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
			])}
		</>
	),
};

export const TextAndImages: StoryObj = {
	name: 'text and images',
	render: () => (
		<>
			{renderMessageBlocks([
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
			])}
		</>
	),
};
