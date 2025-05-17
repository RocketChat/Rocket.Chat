import type { Meta, StoryFn } from '@storybook/react';
import outdent from 'outdent';

import MarkdownText from './MarkdownText';

export default {
	title: 'Components/MarkdownText',
	component: MarkdownText,
	parameters: {
		layout: 'padded',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof MarkdownText>;

export const Example: StoryFn<typeof MarkdownText> = () => (
	<MarkdownText
		content={outdent`
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
		`}
	/>
);

const Template: StoryFn<typeof MarkdownText> = (args) => <MarkdownText {...args} />;

export const Document = Template.bind({});
Document.args = {
	content: outdent`
		# Title

		Paragraph text.

		## Subtitle

		- List item 1
		- List item 2
		- List item 3
	`,
	variant: 'document',
};

export const Inline = Template.bind({});
Inline.args = {
	content: outdent`
		# Title

		Paragraph text.

		## Subtitle

		- List item 1
		- List item 2
		- List item 3
	`,
	variant: 'inline',
};

export const InlineWithoutBreaks = Template.bind({});
InlineWithoutBreaks.args = {
	content: outdent`
		# Title

		Paragraph text.

		## Subtitle

		- List item 1
		- List item 2
		- List item 3
	`,
	variant: 'inlineWithoutBreaks',
};
