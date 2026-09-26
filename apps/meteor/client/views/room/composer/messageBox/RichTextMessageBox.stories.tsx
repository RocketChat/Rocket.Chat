import { ComposerMarkup, ComposerMarkupContext } from '@rocket.chat/gazzodown-alt';
import type { Options } from '@rocket.chat/message-parser';
import { parse } from '@rocket.chat/message-parser';
import {
	MessageComposer,
	MessageComposerAction,
	MessageComposerActionsDivider,
	MessageComposerToolbar,
	MessageComposerToolbarActions,
	MessageComposerToolbarSubmit,
	RichTextComposerInput,
} from '@rocket.chat/ui-composer';
import type { Meta, StoryObj } from '@storybook/react';

// Mirrors the options RichTextMessageBox feeds the parser: emoticons, KaTeX and colors are all off
// there, so nodes gated behind them never reach ComposerMarkup.
const parseOptions: Options = { emoticons: false };

const markdownSample = [
	'# Heading one',
	'## Heading two',
	'### Heading three',
	'#### Heading four',
	'',
	'Plain text with *bold*, **bold double**, _italic_, ~strike~, ~~strike double~~, `inline code`, ||inline spoiler|| and an escaped \\*asterisk\\*.',
	'',
	'Mentions @rocket.cat and #general, emoji :smile: and 😀.',
	'',
	'Links [markdown link](https://rocket.chat), <https://rocket.chat|angle bracket link>, bare https://rocket.chat, support@rocket.chat, +15551234567 and ![alt text](https://rocket.chat/logo.png).',
	'',
	'Timestamp <t:1700000000:F>, escaped \\<t:1700000000:F> and color:#ff0000.',
	'',
	'> Quote line one',
	'> Quote line two',
	'',
	'||',
	'Spoiler block line one',
	'Spoiler block line two',
	'||',
	'',
	'- Hyphen list item',
	'- Second hyphen item',
	'',
	'* Asterisk list item',
	'* Second asterisk item',
	'',
	'1. Ordered item one',
	'2. Ordered item two',
	'',
	'- [x] Completed task',
	'- [ ] Pending task',
	'',
	'| Column A | Column B |',
	'| --- | ---: |',
	'| cell one | cell two |',
	'',
	'---',
	'',
	'```js',
	"const fenced = 'code block';",
	'```',
].join('\n');

// Labels mirror `formattingButtons` so the toolbar is as accessible here as it is in MessageBoxBase.
const formatters = [
	{ icon: 'bold', label: 'Bold' },
	{ icon: 'italic', label: 'Italic' },
	{ icon: 'strike', label: 'Strikethrough' },
	{ icon: 'code', label: 'Inline code' },
	{ icon: 'multiline', label: 'Multi line code' },
	{ icon: 'list-bullets', label: 'Bulleted list' },
	{ icon: 'list-numbers', label: 'Numbered list' },
	{ icon: 'link', label: 'Link' },
	{ icon: 'katex', label: 'KaTeX' },
] as const;

type RealTimeComposerProps = {
	source: string;
	placeholder: string;
};

const RealTimeComposer = ({ source, placeholder }: RealTimeComposerProps) => (
	<MessageComposer>
		<ComposerMarkupContext.Provider value={{ source }}>
			<RichTextComposerInput name='msg' aria-label={placeholder} placeholder={placeholder} hideplaceholder={source !== ''}>
				{source !== '' && <ComposerMarkup tokens={parse(source, parseOptions)} />}
			</RichTextComposerInput>
		</ComposerMarkupContext.Provider>
		<MessageComposerToolbar>
			<MessageComposerToolbarActions aria-label='Message actions'>
				<MessageComposerAction aria-label='Emoji' icon='emoji' />
				<MessageComposerActionsDivider />
				{formatters.map(({ icon, label }) => (
					<MessageComposerAction key={icon} aria-label={label} icon={icon} />
				))}
			</MessageComposerToolbarActions>
			<MessageComposerToolbarSubmit>
				<MessageComposerAction aria-label='Send' icon='send' secondary={source !== ''} info={source !== ''} />
			</MessageComposerToolbarSubmit>
		</MessageComposerToolbar>
	</MessageComposer>
);

const meta = {
	title: 'Composer/RealTimeComposer',
	component: RealTimeComposer,
	args: {
		placeholder: 'Message',
		source: '',
	},
} satisfies Meta<typeof RealTimeComposer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithText: Story = {
	args: {
		source: markdownSample,
	},
};
