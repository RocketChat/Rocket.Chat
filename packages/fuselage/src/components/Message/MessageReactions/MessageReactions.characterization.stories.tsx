import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import MessageReaction from './MessageReaction';
import MessageReactionAction from './MessageReactionAction';
import MessageReactionCounter from './MessageReactionCounter';
import MessageReactionEmoji from './MessageReactionEmoji';
import MessageReactions from './MessageReactions';
import { ariaSnapshot, classContract, computed, expectComputed, expectForwards, forcePseudo, isJsdom } from '../../../testing/g0';
import Message from '../Message';
import MessageBody from '../MessageBody';
import MessageContainer from '../MessageContainer';

// G0 characterization of the message reactions on their develop implementation. A rewrite passes these unedited, in jest and
// in the compiled zero-runtime Storybook; see src/testing/README.md.
//
// Not asserted on purpose, because the approved migration changes it: whether keyboard focus on a link in the body reveals the
// add-reaction action (it does today, through `:has(:focus-visible)`).
export default {
	title: 'Characterization/MessageReactions',
	component: MessageReactions,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof MessageReactions>;

type Story = StoryObj<typeof MessageReactions>;

const forwarded = (name: string) => ({
	'className': `${name}-class`,
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const containerRef = createRef<HTMLDivElement>();
const reactionRef = createRef<HTMLDivElement>();
const containerHandlers = { onMouseEnter: fn(), onClick: fn() };
// What the app spreads from react-aria's `useButton` and from the tooltip, next to the ref and the label
const reactionHandlers = {
	onClick: fn(),
	onKeyDown: fn(),
	onKeyUp: fn(),
	onPointerDown: fn(),
	onPointerUp: fn(),
	onMouseDown: fn(),
	onMouseEnter: fn(),
	onMouseLeave: fn(),
	onFocus: fn(),
	onBlur: fn(),
};
const actionHandlers = { onClick: fn(), onKeyDown: fn(), onMouseEnter: fn() };
const emojiSprite = 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=)';

export const Forwarding: Story = {
	render: () => (
		<MessageReactions ref={containerRef} {...forwarded('container')} {...containerHandlers}>
			<MessageReaction ref={reactionRef} {...forwarded('reaction')} data-tooltip='Reacted by you' {...reactionHandlers}>
				<MessageReactionEmoji {...forwarded('emoji')} name='rocket'>
					🚀
				</MessageReactionEmoji>
				<MessageReactionCounter counter={3} className='counter-class' />
			</MessageReaction>
			<MessageReactionAction {...forwarded('action')} {...actionHandlers} />
		</MessageReactions>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-message-reactions__container', {
			...forwarded('container'),
			ref: containerRef,
			handlers: containerHandlers,
		});
		await expectForwards(canvasElement, '#reaction-id', { ...forwarded('reaction'), ref: reactionRef, handlers: reactionHandlers });
		await expect(canvasElement.querySelector('#reaction-id')).toHaveAttribute('data-tooltip', 'Reacted by you');
		await expectForwards(canvasElement, '.rcx-message-reactions__emoji', forwarded('emoji'));
		await expectForwards(canvasElement, '.rcx-message-reactions__counter', { className: 'counter-class' });
		await expectForwards(canvasElement, '#action-id', { ...forwarded('action'), handlers: actionHandlers });
	},
};

// The reaction is a button on its own; a consumer's role and tab index win over the defaults
export const ButtonDefaults: Story = {
	render: () => (
		<MessageReactions>
			<MessageReaction id='default' title='default' />
			<MessageReaction id='custom' title='custom' role='switch' tabIndex={-1} />
			<MessageReactionAction id='action' title='action' />
		</MessageReactions>
	),
	play: async ({ canvasElement }) => {
		const el = (id: string) => canvasElement.querySelector(`#${id}`) as HTMLElement;
		await expect(el('default')).toHaveAttribute('role', 'button');
		await expect(el('default')).toHaveAttribute('tabindex', '0');
		await expect(el('custom')).toHaveAttribute('role', 'switch');
		await expect(el('custom')).toHaveAttribute('tabindex', '-1');
		await expect(el('action')).toHaveAttribute('role', 'button');
		await expect(el('action')).toHaveAttribute('tabindex', '0');
	},
};

const everyVariation = (
	<MessageReactions>
		<MessageReaction title='1 reaction' mine>
			<MessageReactionCounter counter={1} />
		</MessageReaction>
		<MessageReaction title='rocket'>
			<MessageReactionEmoji name='rocket'>🚀</MessageReactionEmoji>
			<MessageReactionCounter counter={2} />
		</MessageReaction>
		<MessageReactionAction title='Add reaction' />
	</MessageReactions>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(['- button "1"', '- button "🚀 2"', '- button "Add reaction"'].join('\n'));
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div: rcx-message-reactions__container',
				'root > div > div[0]: rcx-message-reactions__reaction rcx-message-reactions__reaction--mine',
				'root > div > div[0] > div: rcx-message-reactions__counter',
				'root > div > div[1]: rcx-message-reactions__reaction',
				'root > div > div[1] > span: rcx-message-reactions__emoji',
				'root > div > div[1] > div: rcx-message-reactions__counter',
				'root > div > div[2]: rcx-message-reactions__reaction rcx-message-reactions__reaction--action',
				'root > div > div[2] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-emoji-plus',
			].join('\n'),
		);
	},
};

const el = (root: HTMLElement, id: string) => root.querySelector(`#${id}`) as HTMLElement;

export const ContainerAndPillLayout: Story = {
	render: () => (
		<div style={{ width: 90 }}>
			<MessageReactions id='container'>
				<MessageReaction id='first'>
					<MessageReactionEmoji name='rocket' image={emojiSprite} id='emoji' />
					<MessageReactionCounter counter={12} />
				</MessageReaction>
				<MessageReaction id='second'>
					<MessageReactionCounter counter={2} />
				</MessageReaction>
				<MessageReaction id='third'>
					<MessageReactionCounter counter={3} />
				</MessageReaction>
				<MessageReaction id='fourth'>
					<MessageReactionCounter counter={4} />
				</MessageReaction>
				<MessageReaction id='fifth'>
					<MessageReactionCounter counter={5} />
				</MessageReaction>
			</MessageReactions>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const container = el(canvasElement, 'container');
		await expect(computed(container, 'display')).toBe('flex');
		await expect(computed(container, 'flex-wrap')).toBe('wrap');
		await expect(computed(container, 'column-gap')).toBe('4px');
		await expect(computed(container, 'row-gap')).toBe('4px');

		const first = el(canvasElement, 'first');
		await expect(computed(first, 'align-items')).toBe('center');
		await expect(computed(first, 'padding-top')).toBe('2px');
		await expect(computed(first, 'cursor')).toBe('pointer');

		// The pills sit 4px apart and wrap onto a second row 4px below
		const rects = ['first', 'second', 'third', 'fourth', 'fifth'].map((id) => el(canvasElement, id).getBoundingClientRect());
		await expect(rects[1].left - rects[0].right).toBe(4);
		const wrapped = rects.find((rect) => rect.top > rects[0].top) as DOMRect;
		await expect(wrapped).toBeDefined();
		await expect(wrapped.top - rects[0].bottom).toBe(4);

		// The emoji is a 14px square, and sizes the pill's glyph
		const emoji = el(canvasElement, 'emoji');
		await expect(emoji.getBoundingClientRect().width).toBe(14);
		await expect(emoji.getBoundingClientRect().height).toBe(14);
		await expect(computed(emoji, 'background-image')).toMatch(/data:image\/gif/);
	},
};

const pills = (
	<MessageReactions>
		<MessageReaction id='plain'>
			<MessageReactionCounter counter={1} />
		</MessageReaction>
		<MessageReaction id='mine' mine>
			<MessageReactionCounter counter={1} />
		</MessageReaction>
	</MessageReactions>
);

export const PillStates: Story = {
	render: () => pills,
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const paint = (id: string) => ({
			color: computed(el(canvasElement, id), 'color'),
			border: computed(el(canvasElement, id), 'border-top-color'),
			background: computed(el(canvasElement, id), 'background-color'),
		});
		const plain = paint('plain');
		const mine = paint('mine');
		await expect(mine.color).not.toBe(plain.color);
		await expect(mine.background).not.toBe(plain.background);
		await expect(computed(el(canvasElement, 'plain'), 'border-top-style')).toBe('solid');
		await expect(computed(el(canvasElement, 'plain'), 'border-top-width')).toBe('1px');

		// Hover changes the border, and wins over `mine` for the background
		forcePseudo(el(canvasElement, 'plain'), 'hover');
		forcePseudo(el(canvasElement, 'mine'), 'hover');
		await expectComputed(el(canvasElement, 'mine'), 'background-color', paint('plain').background);
		const hoveredPlain = paint('plain');
		await expect(hoveredPlain.border).not.toBe(plain.border);
		await expect(paint('mine').border).toBe(hoveredPlain.border);
	},
};

export const PillFocusVisible: Story = {
	render: () => pills,
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const plain = el(canvasElement, 'plain');
		const rest = computed(plain, 'border-top-color');
		forcePseudo(plain, 'hover');
		await expect(computed(plain, 'border-top-color')).not.toBe(rest);
		const hovered = computed(plain, 'border-top-color');

		// The focus border wins over the hover one, so a keyboard-focused pill keeps it under the pointer
		forcePseudo(plain, 'focus-visible');
		await expect(computed(plain, 'border-top-color')).not.toBe(hovered);
		await expect(computed(plain, 'border-top-color')).not.toBe(rest);
		await expect(computed(plain, 'outline-style')).toBe('none');
		await expect(computed(plain, 'box-shadow')).not.toBe('none');
	},
};

const actionRow = (id: string) => (
	<Message id={id} tabIndex={0}>
		<MessageContainer>
			<MessageBody>
				<a id={`${id}-link`} href='#anchor'>
					link
				</a>
			</MessageBody>
			<MessageReactions>
				<MessageReaction id={`${id}-reaction`}>
					<MessageReactionCounter counter={1} />
				</MessageReaction>
				<MessageReactionAction id={`${id}-action`} title='Add reaction' />
			</MessageReactions>
		</MessageContainer>
	</Message>
);

const revealed = async (root: HTMLElement, id: string) => {
	await expectComputed(el(root, `${id}-action`), 'opacity', '1');
	await expect(computed(el(root, `${id}-action`), 'pointer-events')).toBe('auto');
};

export const ActionRevealStates: Story = {
	render: () => (
		<div style={{ width: 500 }}>
			{actionRow('rest')}
			{actionRow('hover')}
			{actionRow('row-focus')}
			{actionRow('own-focus')}
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		// The reaction pills are always there; only the add-reaction action hides until the row is hovered or focused
		await expect(computed(el(canvasElement, 'rest-reaction'), 'opacity')).toBe('1');
		await expect(computed(el(canvasElement, 'rest-action'), 'opacity')).toBe('0');
		await expect(computed(el(canvasElement, 'rest-action'), 'pointer-events')).toBe('none');
		await expect(el(canvasElement, 'rest-action').getBoundingClientRect().width).toBeGreaterThan(0);

		forcePseudo(el(canvasElement, 'hover'), 'hover');
		await revealed(canvasElement, 'hover');
		await expect(computed(el(canvasElement, 'rest-action'), 'opacity')).toBe('0');

		forcePseudo(el(canvasElement, 'row-focus'), 'focus-visible');
		await revealed(canvasElement, 'row-focus');

		// Tab into the action itself
		forcePseudo(el(canvasElement, 'own-focus-action'), 'focus-visible');
		await revealed(canvasElement, 'own-focus');
	},
};

export const ActionTakesFocus: Story = {
	render: () => <div style={{ width: 500 }}>{actionRow('row')}</div>,
	play: async ({ canvasElement }) => {
		const action = el(canvasElement, 'row-action');
		action.focus();
		await expect(action).toHaveFocus();
	},
};
