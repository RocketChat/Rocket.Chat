import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import outdent from 'outdent';

import MarkdownText from './MarkdownText';

const meta = {
	title: 'Components/MarkdownText',
	component: MarkdownText,
	parameters: {
		layout: 'fullscreen',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof MarkdownText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		content: outdent`
			# h1 Heading
			## h2 Heading
			### h3 Heading
			#### h4 Heading
			##### h5 Heading
			###### h6 Heading

			___

			*This is bold text*

			_This is italic text_

			~Strikethrough~

			+ Lorem ipsum dolor sit amet
			+ Consectetur adipiscing elit
			+ Integer molestie lorem at massa

			1. Lorem ipsum dolor sit amet
			2. Consectetur adipiscing elit
			3. Integer molestie lorem at massa

			\`rocket.chat();\`

			https://rocket.chat
		`,
	},
};

export const Document: Story = {
	args: {
		content: outdent`
		# Title

		Paragraph text.

		## Subtitle

		- List item 1
		- List item 2
		- List item 3

		\`2 < 3 > 1 & 4 "Test"\`

		\`\`\`
		Two < Three > One & Four "Test"
		\`\`\`
		`,
		variant: 'document',
	},
	play: async (test) => {
		const canvas = within(test.context.canvasElement);
		expect(await canvas.findByRole('heading', { level: 1 })).toHaveTextContent('Title');
		expect(await canvas.findByRole('heading', { level: 2 })).toHaveTextContent('Subtitle');

		const listItem1 = await canvas.findByText('List item 1');
		expect(listItem1).toBeVisible();

		const listItem2 = await canvas.findByText('List item 2');
		expect(listItem2).toBeVisible();

		const listItem3 = await canvas.findByText('List item 3');
		expect(listItem3).toBeVisible();

		const inlineCode = await canvas.findByText('2 < 3 > 1 & 4 "Test"');
		expect(inlineCode).toBeVisible();

		const blockCode = await canvas.findByText('Two < Three > One & Four "Test"');
		expect(blockCode).toBeVisible();
	},
};

export const Inline: Story = {
	args: {
		content: outdent`
		# Title

		Paragraph text.

		## Subtitle

		- List item 1
		- List item 2
		- List item 3
	`,
		variant: 'inline',
	},
};

export const InlineWithoutBreaks: Story = {
	args: {
		content: outdent`
		# Title

		Paragraph text.

		## Subtitle

		- List item 1
		- List item 2
		- List item 3
		`,
		variant: 'inlineWithoutBreaks',
	},
};
