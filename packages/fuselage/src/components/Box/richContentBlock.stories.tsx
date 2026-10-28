import type { Meta, StoryObj } from '@storybook/react-vite';

import Box from './Box';

export default {
	title: 'Layout/Box/Rich content/Block',
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

export const Hx: Story = {
	name: 'hx',
	render: () => (
		<>
			<h1>Heading 1</h1>
			<h2>Heading 2</h2>
			<h3>Heading 3</h3>
			<h4>Heading 4</h4>
			<h5>Heading 5</h5>
			<h6>Heading 6</h6>
		</>
	),
};

export const P: Story = {
	name: 'p',
	render: () => <p>Paragraph</p>,
};

export const Ul: Story = {
	name: 'ul',
	render: () => (
		<ul>
			<li>unordered list item 1</li>
			<li>unordered list item 2</li>
			<li>unordered list item 3</li>
		</ul>
	),
};

export const Ol: Story = {
	name: 'ol',
	render: () => (
		<ol>
			<li>ordered list item 1</li>
			<li>ordered list item 2</li>
			<li>ordered list item 3</li>
		</ol>
	),
};

export const Dl: Story = {
	name: 'dl',
	render: () => (
		<dl>
			<dt>description list term 1</dt>
			<dd>description list description 1</dd>
			<dt>description list term 2</dt>
			<dd>description list description 2</dd>
			<dt>description list term 3</dt>
			<dd>description list description 3</dd>
		</dl>
	),
};

export const Table: Story = {
	name: 'table',
	render: () => (
		<table>
			<thead>
				<tr>
					<th>Column 1</th>
					<th>Column 2</th>
					<th>Column 3</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Item 1 of row 1</td>
					<td>Item 2 of row 1</td>
					<td>Item 3 of row 1</td>
				</tr>
				<tr>
					<td>Item 1 of row 2</td>
					<td>Item 2 of row 2</td>
					<td>Item 3 of row 2</td>
				</tr>
				<tr>
					<td>Item 1 of row 3</td>
					<td>Item 2 of row 3</td>
					<td>Item 3 of row 3</td>
				</tr>
			</tbody>
		</table>
	),
};

export const TableComplex: Story = {
	name: 'table (complex)',
	render: () => (
		<table>
			<caption>Caption</caption>
			<thead>
				<tr>
					<th>Column 1</th>
					<th>Column 2</th>
					<th>Column 3</th>
				</tr>
			</thead>
			<tfoot>
				<tr>
					<th>Column 1</th>
					<th>Column 2</th>
					<th>Column 3</th>
				</tr>
			</tfoot>
			<tbody>
				<tr>
					<td>Item 1 of row 1</td>
					<td>Item 2 of row 1</td>
					<td>Item 3 of row 1</td>
				</tr>
				<tr>
					<td>Item 1 of row 2</td>
					<td>Item 2 of row 2</td>
					<td>Item 3 of row 2</td>
				</tr>
				<tr>
					<td>Item 1 of row 3</td>
					<td>Item 2 of row 3</td>
					<td>Item 3 of row 3</td>
				</tr>
			</tbody>
		</table>
	),
};

export const BlockquoteAndCite: Story = {
	name: 'blockquote and cite',
	render: () => (
		<blockquote>
			<p>Words can be like X-rays, if you use them properly — they’ll go through anything. You read and you’re pierced.</p>
			<footer>
				— Aldous Huxley, <cite>Brave New World</cite>
			</footer>
		</blockquote>
	),
};

export const Pre: Story = {
	name: 'pre',
	render: () => (
		<pre>
			# A UNINTENDED LOL-ZONE: SORRY FOR THIS{'\n'}# ------------+----------+-------------{'\n'}# /\O | _O | O {'\n'}# /\/ | //|_ | /_{' '}
			{'\n'}# /\ | | | |\ {'\n'}# / \ | /| | / | {'\n'}# LOL LOL | LLOL | LOLLOL {'\n'}# ------------+----------+-------------{'\n'}# BLACK
			MAGIC FULL FEATURED ENABLED
		</pre>
	),
};

export const PreWithCode: Story = {
	name: 'pre with code',
	render: () => (
		<pre>
			<code>
				# A UNINTENDED LOL-ZONE: SORRY FOR THIS{'\n'}# ------------+----------+-------------{'\n'}# /\O | _O | O {'\n'}# /\/ | //|_ | /_{' '}
				{'\n'}# /\ | | | |\ {'\n'}# / \ | /| | / | {'\n'}# LOL LOL | LLOL | LOLLOL {'\n'}# ------------+----------+-------------{'\n'}#
				BLACK MAGIC FULL FEATURED ENABLED
			</code>
		</pre>
	),
};
