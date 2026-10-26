import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Box from './Box';

export default {
	title: 'Layout/Box/Rich content/Inline',
	component: Box,
	parameters: {
		docs: {
			description: {
				component: 'Here is how rich content will be rendered, in details.',
			},
		},
	},
} satisfies Meta<typeof Box>;

type Story = StoryObj<typeof Box>;

export const Strong: Story = {
	name: 'strong',
	render: () => <strong>strong importance</strong>,
};

export const Em: Story = {
	name: 'em',
	render: () => <em>emphasis</em>,
};

export const B: Story = {
	name: 'b',
	render: () => <b>bring attention</b>,
};

export const I: Story = {
	name: 'i',
	render: () => <i>technical terms, foreign language phrases, or fictional character thoughts</i>,
};

export const A: Story = {
	name: 'a',
	parameters: { pseudo: { focus: '#focused-link', focusVisible: '#focused-link' } },
	render: () => (
		<>
			<div>
				<a href='#any'>Normal</a>
			</div>
			<br />
			<div>
				<a href='#any' id='focused-link'>
					Focused
				</a>
			</div>
		</>
	),
};

export const QAndCite: Story = {
	name: 'q and cite',
	render: () => (
		<q>
			The problem with quotes found on the internet is that they are often not true. <cite>Abraham Lincoln</cite>
		</q>
	),
};

export const Code: Story = {
	name: 'code',
	render: () => <code>inline code</code>,
};

export const Time: Story = {
	name: 'time',
	render: () => <time dateTime='20220101 10:00'>January 1th 2022, 10 a.m.</time>,
};

export const Dfn: Story = {
	name: 'dfn',
	render: () => (
		<>
			<dfn>Definition:</dfn> description.
		</>
	),
};

export const Abbr: Story = {
	name: 'abbr',
	render: () => <abbr title='Source Development Kit'>SDK</abbr>,
};

export const SupAndSub: Story = {
	name: 'sup and sub',
	render: () => (
		<>
			<sup>superscript</sup> <sub>subscript</sub>
		</>
	),
};

export const Kbd: Story = {
	name: 'kbd',
	render: () => <kbd>Ctrl + Alt + Del</kbd>,
};

export const Small: Story = {
	name: 'small',
	render: () => <small>small text</small>,
};
