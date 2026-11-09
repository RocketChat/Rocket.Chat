import type { Meta, StoryObj } from '@storybook/react';

import RichContent from './RichContent';

const meta = {
	component: RichContent,
} satisfies Meta<typeof RichContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: (
			<>
				<h2>Heading</h2>
				<p>
					A paragraph with a <a href='#rich-content'>link</a> and some <code>code</code>.
				</p>
				<ul>
					<li>First item</li>
					<li>Second item</li>
				</ul>
			</>
		),
	},
};

export const FromHtml: Story = {
	args: {
		dangerouslySetInnerHTML: { __html: '<p>Formatted text that arrives as <strong>HTML</strong>.</p><ol><li>One</li><li>Two</li></ol>' },
	},
};
