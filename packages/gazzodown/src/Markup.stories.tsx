import { css } from '@rocket.chat/css-in-js';
import { Box, MessageBody, MessageContainer } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { parse } from '@rocket.chat/message-parser';
import type { ComponentMeta, ComponentStoryFn, StoryFn } from '@storybook/react';
import outdent from 'outdent';
import { ReactElement, Suspense } from 'react';

import Markup from './Markup';

export default {
	title: 'Markup',
	component: Markup,
	decorators: [
		(Story): ReactElement => (
			<Suspense fallback={null}>
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

export const empty = Template.bind({});
empty.args = {
	tokens: [],
};

export const bigEmoji = Template.bind({});
bigEmoji.args = {
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

export const paragraph = Template.bind({});
paragraph.args = {
	tokens: [
		{
			type: 'PARAGRAPH',
			value: [{ type: 'PLAIN_TEXT', value: 'Hello' }],
		},
	],
};

export const heading = Template.bind({});
heading.args = {
	tokens: [
		{
			type: 'HEADING',
			level: 2,
			value: [{ type: 'PLAIN_TEXT', value: 'Hello' }],
		},
	],
};

export const unorderedList = Template.bind({});
unorderedList.args = {
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

export const orderedList = Template.bind({});
orderedList.args = {
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

export const taskList = Template.bind({});
taskList.args = {
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

export const blockquote = Template.bind({});
blockquote.args = {
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

export const code = Template.bind({});
code.args = {
	tokens: [
		{
			type: 'CODE',
			value: [{ type: 'CODE_LINE', value: { type: 'PLAIN_TEXT', value: 'const foo = bar;' } }],
			language: undefined,
		},
	],
};

export const codeWithLanguage = Template.bind({});
codeWithLanguage.args = {
	tokens: [
		{
			type: 'CODE',
			value: [{ type: 'CODE_LINE', value: { type: 'PLAIN_TEXT', value: 'const foo = bar;' } }],
			language: 'javascript',
		},
	],
};

export const katex = Template.bind({});
katex.args = {
	tokens: [
		{
			type: 'KATEX',
			value: 'x^2 + y^2 = z^2',
		},
	],
};

export const lineBreak = Template.bind({});
lineBreak.args = {
	tokens: [
		{
			type: 'LINE_BREAK',
			value: undefined,
		},
	],
};

export const example: StoryFn<{ msg: string }> = ({ msg }) => (
	<Markup tokens={parse(msg, { katex: { dollarSyntax: true, parenthesisSyntax: true }, colors: true, emoticons: true })} />
);
example.args = {
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
