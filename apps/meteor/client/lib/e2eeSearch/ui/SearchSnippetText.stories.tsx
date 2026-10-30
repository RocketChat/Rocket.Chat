import type { Meta, StoryObj } from '@storybook/react';

import SearchSnippetText from './SearchSnippetText';

const meta = {
	component: SearchSnippetText,
	args: { snippet: 'The <mark>needle</mark> is here.' },
} satisfies Meta<typeof SearchSnippetText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const File: Story = { args: { snippet: 'Q3 <mark>budget</mark> draft\nbudget-2026.pdf' } };
export const MultilineHighlight: Story = { args: { snippet: '<mark>one\r\ntwo</mark>\n\n \nthree\n' } };
export const UnclosedHighlight: Story = { args: { snippet: 'one <mark>two' } };
export const AdjacentHighlights: Story = { args: { snippet: '<mark>one</mark><mark>two</mark>' } };
export const EscapedText: Story = { args: { snippet: 'a &lt;b&gt; &amp; &quot;c&quot; &#39;d&#39;' } };
export const UnsafeMarkup: Story = {
	args: { snippet: '<script>alert(1)</script> <mark>&lt;img src=x onerror=alert(1)&gt;</mark>' },
};
export const LiteralHighlight: Story = { args: { snippet: '&lt;mark&gt;fake&lt;/mark&gt; &amp;lt;mark&amp;gt; &nbsp;&#x3C;' } };
export const Empty: Story = { args: { snippet: '' } };
