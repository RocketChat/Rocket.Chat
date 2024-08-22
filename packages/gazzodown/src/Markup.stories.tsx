import { css } from '@rocket.chat/css-in-js';
import { Box, MessageBody, MessageContainer } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { Options, parse } from '@rocket.chat/message-parser';
import type { ComponentMeta, ComponentStoryFn, StoryFn } from '@storybook/react';
import outdent from 'outdent';
import { ReactElement, Suspense } from 'react';

import Markup from './Markup';
import { MarkupInteractionContext } from './MarkupInteractionContext';

export default {
	title: 'Markup',
	component: Markup,
	decorators: [
		(Story): ReactElement => (
			<Suspense fallback={null}>
				<MarkupInteractionContext.Provider value={{ enableTimestamp: true }}>
					<MessageContainer>
						<MessageBody>
							<Box
								className={css`
									> blockquote {
										padding-inline: 8px;
										border-radius: 2px;
										border-width: 2px;
										border-style: solid;
										background-color: var(--rcx-color-neutral-100, ${colors.n100});
										border-color: var(--rcx-color-neutral-200, ${colors.n200});
										border-inline-start-color: var(--rcx-color-neutral-600, ${colors.n600});

										&:hover,
										&:focus {
											background-color: var(--rcx-color-neutral-200, ${colors.n200});
											border-color: var(--rcx-color-neutral-300, ${colors.n300});
											border-inline-start-color: var(--rcx-color-neutral-600, ${colors.n600});
										}
									}

									> ul.task-list {
										> li::before {
											display: none;
										}

										> li > .rcx-check-box > .rcx-check-box__input:focus + .rcx-check-box__fake {
											z-index: 1;
										}

										list-style: none;
										margin-inline-start: 0;
										padding-inline-start: 0;
									}
								`}
							>
								<Story />
							</Box>
						</MessageBody>
					</MessageContainer>
				</MarkupInteractionContext.Provider>
				{/* workaround? */}
				<Box />
			</Suspense>
		),
	],
	parameters: {
		docs: {
			source: {
				code: 'Disabled for this story, see https://github.com/storybookjs/storybook/issues/11554',
			},
		},
	},
} as ComponentMeta<typeof Markup>;

const Template: ComponentStoryFn<typeof Markup> = (args) => <Markup {...args} />;

export const Empty = Template.bind({});
Empty.args = {
	tokens: [],
};

export const Timestamp = Template.bind({});

Timestamp.args = {
	tokens: parse(`Short time: <t:${((): number => Math.floor(Date.now() / 1000))()}:t>
	Long time: <t:${((): number => Math.floor(Date.now() / 1000))()}:T>
	Short date: <t:${((): number => Math.floor(Date.now() / 1000))()}:d>
	Long date: <t:${((): number => Math.floor(Date.now() / 1000))()}:D>
	Full date: <t:${((): number => Math.floor(Date.now() / 1000))()}:f>
	Full date (long): <t:${((): number => Math.floor(Date.now() / 1000))()}:F>
	Relative time from past: <t:${((): number => {
		const date = new Date();
		date.setHours(date.getHours() - 1);
		return Math.floor(date.getTime() / 1000);
	})()}:R>
	Relative to Future: <t:${((): number => {
		const date = new Date();
		date.setHours(date.getHours() + 1);
		return Math.floor(date.getTime() / 1000);
	})()}:R>
	Relative Seconds: <t:${((): number => {
		const date = new Date();
		date.setSeconds(date.getSeconds() - 1);
		return Math.floor(date.getTime() / 1000);
	})()}:R>

`),
};

export const BigEmoji = Template.bind({});
BigEmoji.args = {
	tokens: [
		{
			type: 'BIG_EMOJI',
			value: [
				{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: 'smile' }, shortCode: 'smile' },
				{ type: 'EMOJI', value: undefined, unicode: '😀' },
				{ type: 'EMOJI', value: { type: 'PLAIN_TEXT', value: 'smile' }, shortCode: 'smile' },
			],
		},
	],
};

export const Paragraph = Template.bind({});
Paragraph.args = {
	tokens: [
		{
			type: 'PARAGRAPH',
			value: [{ type: 'PLAIN_TEXT', value: 'Hello' }],
		},
	],
};

export const Heading = Template.bind({});
Heading.args = {
	tokens: [
		{
			type: 'HEADING',
			level: 2,
			value: [{ type: 'PLAIN_TEXT', value: 'Hello' }],
		},
	],
};

export const UnorderedList = Template.bind({});
UnorderedList.args = {
	tokens: [
		{
			type: 'UNORDERED_LIST',
			value: [
				{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Hello' }] },
				{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Hola' }] },
				{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: '你好' }] },
			],
		},
	],
};

export const OrderedList = Template.bind({});
OrderedList.args = {
	tokens: [
		{
			type: 'ORDERED_LIST',
			value: [
				{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Hello' }] },
				{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: 'Hola' }] },
				{ type: 'LIST_ITEM', value: [{ type: 'PLAIN_TEXT', value: '你好' }] },
			],
		},
	],
};

export const TaskList = Template.bind({});
TaskList.args = {
	tokens: [
		{
			type: 'TASKS',
			value: [
				{ type: 'TASK', status: true, value: [{ type: 'PLAIN_TEXT', value: 'Chores' }] },
				{ type: 'TASK', status: false, value: [{ type: 'PLAIN_TEXT', value: 'Dishes' }] },
				{ type: 'TASK', status: true, value: [{ type: 'PLAIN_TEXT', value: 'Laundry' }] },
			],
		},
	],
};

export const Blockquote = Template.bind({});
Blockquote.args = {
	tokens: [
		{
			type: 'QUOTE',
			value: [
				{
					type: 'PARAGRAPH',
					value: [{ type: 'PLAIN_TEXT', value: 'Cogito ergo sum.' }],
				},
				{
					type: 'PARAGRAPH',
					value: [{ type: 'PLAIN_TEXT', value: 'Sit amet, consectetur adipiscing elit.' }],
				},
				{
					type: 'PARAGRAPH',
					value: [{ type: 'PLAIN_TEXT', value: 'Donec eget ex euismod, euismod nisi euismod, vulputate nisi.' }],
				},
			],
		},
	],
};

export const Code = Template.bind({});
Code.args = {
	tokens: [
		{
			type: 'CODE',
			value: [{ type: 'CODE_LINE', value: { type: 'PLAIN_TEXT', value: 'const foo = bar;' } }],
			language: undefined,
		},
	],
};

export const CodeWithLanguage = Template.bind({});
CodeWithLanguage.args = {
	tokens: [
		{
			type: 'CODE',
			value: [{ type: 'CODE_LINE', value: { type: 'PLAIN_TEXT', value: 'const foo = bar;' } }],
			language: 'javascript',
		},
	],
};

export const Katex = Template.bind({});
Katex.args = {
	tokens: [
		{
			type: 'KATEX',
			value: 'x^2 + y^2 = z^2',
		},
	],
};

export const LineBreak = Template.bind({});
LineBreak.args = {
	tokens: [
		{
			type: 'LINE_BREAK',
			value: undefined,
		},
	],
};

export const Example: StoryFn<{ msg: string }> = ({ msg }) => {
	const parseOptions: Options = { katex: { dollarSyntax: true, parenthesisSyntax: true }, colors: true, emoticons: true };

	return <Markup tokens={parse(msg, parseOptions)} />;
};
Example.args = {
	msg: outdent`
		:smile:😀:smile:

		Hello, world!

		# Heading 1
		## Heading 2
		### Heading 3
		#### Heading 4

		* Bullet point 1
		* Bullet point 2
		* Bullet point 3

		1. Numbered point 1
		2. Numbered point 2
		3. Numbered point 3

		- [x] Chores
		- [ ] Dishes
		- [x] Laundry

		> Cogito ergo sum.
		> Sit amet, consectetur adipiscing elit.
		> Donec eget ex euismod, euismod nisi euismod, vulputate nisi.

		\`\`\`
		const x = 1;
		\`\`\`

		\`\`\`js
		const x = 1;
		\`\`\`

		\`\`\`invalid
		const x = 1;
		\`\`\`
	`,
};
