import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn } from 'storybook/test';

import Message from './Message';
import MessageBlock from './MessageBlock';
import MessageBody from './MessageBody';
import MessageContainer from './MessageContainer';
import MessageContainerFixed from './MessageContainerFixed';
import MessageEmoji from './MessageEmoji';
import MessageHeader from './MessageHeader';
import MessageHighlight from './MessageHighlight';
import MessageLeftContainer from './MessageLeftContainer';
import MessageName from './MessageName';
import MessageNameContainer from './MessageNameContainer';
import MessageRole from './MessageRole';
import MessageRoles from './MessageRoles';
import MessageTimestamp from './MessageTimestamp';
import MessageUsername from './MessageUsername';
import { ariaSnapshot, classContract, computed, expectComputed, expectForwards, forcePseudo, isJsdom } from '../../testing/g0';

// G0 characterization of the Message row and its content parts on their develop implementation. A rewrite passes these
// unedited, in jest and in the compiled zero-runtime Storybook; see src/testing/README.md. The specs leave out `style`
// (removed from every part), so they hold after that change.
export default {
	title: 'Characterization/Message',
	component: Message,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Message>;

type Story = StoryObj<typeof Message>;

const forwarded = (name: string) => ({
	'className': `${name}-class`,
	'id': `${name}-id`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const rowRef = createRef<HTMLDivElement>();
const blockRef = createRef<HTMLDivElement>();
const nameContainerRef = createRef<HTMLSpanElement>();
const rowHandlers = { onClick: fn(), onFocus: fn(), onBlur: fn(), onMouseEnter: fn(), onMouseLeave: fn(), onKeyDown: fn() };
const nameContainerHandlers = { onMouseEnter: fn(), onMouseLeave: fn(), onClick: fn() };
const bodyHandlers = { onClick: fn(), onMouseEnter: fn() };
const highlightHandlers = { onClick: fn() };

const sprite = 'url(data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=)';

export const Forwarding: Story = {
	render: () => (
		<Message ref={rowRef} {...forwarded('row')} aria-busy='true' aria-roledescription='message' tabIndex={0} {...rowHandlers}>
			<MessageLeftContainer {...forwarded('left')}>
				<span>Left</span>
			</MessageLeftContainer>
			<MessageContainerFixed {...forwarded('fixed')}>
				<span>Fixed</span>
			</MessageContainerFixed>
			<MessageContainer {...forwarded('container')}>
				<MessageHeader {...forwarded('header')}>
					<MessageNameContainer ref={nameContainerRef} {...forwarded('name-container')} {...nameContainerHandlers}>
						<MessageName {...forwarded('name')}>Name</MessageName>
						<MessageUsername {...forwarded('username')}>@user</MessageUsername>
					</MessageNameContainer>
					<MessageRoles {...forwarded('roles')}>
						<MessageRole {...forwarded('role')}>Admin</MessageRole>
					</MessageRoles>
					<MessageTimestamp {...forwarded('time')}>12:00</MessageTimestamp>
				</MessageHeader>
				<MessageBody {...forwarded('body')} dir='rtl' {...bodyHandlers}>
					Body{' '}
					<MessageHighlight {...forwarded('highlight')} {...highlightHandlers}>
						@mention
					</MessageHighlight>{' '}
					<MessageEmoji {...forwarded('emoji')} name=':smile:' />
				</MessageBody>
				<MessageBlock ref={blockRef} {...forwarded('block')}>
					Block
				</MessageBlock>
			</MessageContainer>
		</Message>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-message', { ...forwarded('row'), ref: rowRef, handlers: rowHandlers });
		const row = canvasElement.querySelector('.rcx-message') as HTMLElement;
		await expect(row).toHaveAttribute('aria-busy', 'true');
		await expect(row).toHaveAttribute('aria-roledescription', 'message');
		await expect(row).toHaveAttribute('tabindex', '0');

		await expectForwards(canvasElement, '.rcx-message-container--left', forwarded('left'));
		await expectForwards(canvasElement, '.rcx-message-container--fixed', forwarded('fixed'));
		await expectForwards(canvasElement, '#container-id', forwarded('container'));
		await expectForwards(canvasElement, '.rcx-message-header', forwarded('header'));
		await expectForwards(canvasElement, '.rcx-message-header__name-container', {
			...forwarded('name-container'),
			ref: nameContainerRef,
			handlers: nameContainerHandlers,
		});
		await expectForwards(canvasElement, '.rcx-message-header__name', forwarded('name'));
		await expectForwards(canvasElement, '.rcx-message-header__username', forwarded('username'));
		await expectForwards(canvasElement, '.rcx-message-header__roles', forwarded('roles'));
		await expectForwards(canvasElement, '.rcx-tag', forwarded('role'));
		await expectForwards(canvasElement, '.rcx-message-header__time', forwarded('time'));
		await expectForwards(canvasElement, '.rcx-message-body', { ...forwarded('body'), handlers: bodyHandlers });
		await expect(canvasElement.querySelector('.rcx-message-body')).toHaveAttribute('dir', 'rtl');
		await expectForwards(canvasElement, '.rcx-message__highlight', { ...forwarded('highlight'), handlers: highlightHandlers });
		await expectForwards(canvasElement, '.rcx-message__emoji', forwarded('emoji'));
		await expectForwards(canvasElement, '.rcx-message-block', { ...forwarded('block'), ref: blockRef });
	},
};

const everyVariation = (
	<>
		<Message tabIndex={0}>
			<MessageLeftContainer>
				<span>Left</span>
			</MessageLeftContainer>
			<MessageContainer>
				<MessageHeader>
					<MessageNameContainer role='button' tabIndex={0}>
						<MessageName>Haylie George</MessageName> <MessageUsername>@haylie.george</MessageUsername>
					</MessageNameContainer>
					<MessageRoles>
						<MessageRole>Admin</MessageRole>
					</MessageRoles>
					<MessageTimestamp>12:00 PM</MessageTimestamp>
				</MessageHeader>
				<MessageBody>
					Hello <MessageHighlight variant='critical'>@all</MessageHighlight> <MessageHighlight variant='relevant'>@me</MessageHighlight>{' '}
					<MessageHighlight variant='link'>#room</MessageHighlight> <MessageHighlight clickable>@user</MessageHighlight>{' '}
					<MessageEmoji name=':smile:' /> <MessageEmoji name=':rocket:' big />
				</MessageBody>
				<MessageBody clamp={2}>Clamped</MessageBody>
				<MessageBlock>Block</MessageBlock>
				<MessageBlock fixedWidth>Fixed block</MessageBlock>
			</MessageContainer>
		</Message>
		<Message sequential clickable hoverable={false} isSelected>
			<MessageContainerFixed>
				<span>Fixed</span>
			</MessageContainerFixed>
			<MessageContainer>
				<MessageBody>Sequential</MessageBody>
			</MessageContainer>
		</Message>
		<Message isEditing isPending>
			<MessageContainer>
				<MessageBody>Editing and pending</MessageBody>
			</MessageContainer>
		</Message>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- text: "Left"',
				'- button "Haylie George @haylie.george"',
				'- text: "Admin"',
				'- text: "12:00 PM"',
				'- text: "Hello"',
				'- text: "@all"',
				'- text: "@me"',
				'- text: "#room"',
				'- text: "@user"',
				'- text: "Clamped"',
				'- text: "Block"',
				'- text: "Fixed block"',
				'- text: "Fixed"',
				'- text: "Sequential"',
				'- text: "Editing and pending"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(messageClasses(canvasElement)).toBe(
			[
				'root > div[0]: rcx-item rcx-message',
				'root > div[0] > div[0]: rcx-item__media rcx-message-container--left',
				'root > div[0] > div[1]: rcx-item__content',
				'root > div[0] > div[1] > div[0]: rcx-item__row rcx-message-header',
				'root > div[0] > div[1] > div[0] > span[0]: rcx-message-header__name-container',
				'root > div[0] > div[1] > div[0] > span[0] > span[0]: rcx-message-header__name',
				'root > div[0] > div[1] > div[0] > span[0] > span[1]: rcx-message-header__username',
				'root > div[0] > div[1] > div[0] > div: rcx-item__row rcx-message-header__roles',
				'root > div[0] > div[1] > div[0] > div > span: rcx-box rcx-box--full rcx-tag',
				'root > div[0] > div[1] > div[0] > div > span > span: rcx-tag__inner',
				'root > div[0] > div[1] > div[0] > span[1]: rcx-item__meta rcx-message-header__time',
				'root > div[0] > div[1] > div[1]: rcx-message-body',
				'root > div[0] > div[1] > div[1] > span[0]: rcx-message__highlight rcx-message__highlight--critical',
				'root > div[0] > div[1] > div[1] > span[1]: rcx-message__highlight rcx-message__highlight--relevant',
				'root > div[0] > div[1] > div[1] > span[2]: rcx-message__highlight rcx-message__highlight--link',
				'root > div[0] > div[1] > div[1] > span[3]: rcx-message__highlight rcx-message__highlight--clickable rcx-message__highlight--other',
				'root > div[0] > div[1] > div[1] > span[4]: rcx-message__emoji',
				'root > div[0] > div[1] > div[1] > span[5]: rcx-message__emoji rcx-message__emoji--big',
				'root > div[0] > div[1] > div[2]: rcx-message-body rcx-message-body--clamp',
				'root > div[0] > div[1] > div[3]: rcx-box rcx-box--full rcx-message-block',
				'root > div[0] > div[1] > div[4]: rcx-box rcx-box--full rcx-message-block rcx-message-block--width-fixed',
				'root > div[1]: rcx-item rcx-message rcx-message--sequential',
				'root > div[1] > div[0]: rcx-item__media rcx-message-container--fixed',
				'root > div[1] > div[1]: rcx-item__content',
				'root > div[1] > div[1] > div: rcx-message-body',
				'root > div[2]: rcx-item rcx-message rcx-message--editing rcx-message--pending',
				'root > div[2] > div: rcx-item__content',
				'root > div[2] > div > div: rcx-message-body',
			].join('\n'),
		);
	},
};

// The row is an Item: its own modifiers (`rcx-item--*`) belong to the Item contract, which may grow, so only the rest is compared
const messageClasses = (root: Element) => classContract(root).replace(/ rcx-item--[\w-]+/g, '');

const fullRow = (id: string, props: Record<string, unknown> = {}, body = 'Body') => (
	<Message id={id} tabIndex={0} {...props}>
		<MessageLeftContainer id={`${id}-left`}>
			<span>Av</span>
		</MessageLeftContainer>
		<MessageContainer>
			<MessageHeader>
				<MessageNameContainer id={`${id}-name`}>
					<MessageName>Name</MessageName>
				</MessageNameContainer>
				<MessageTimestamp id={`${id}-time`}>12:00</MessageTimestamp>
			</MessageHeader>
			<MessageBody id={`${id}-body`}>{body}</MessageBody>
		</MessageContainer>
	</Message>
);

const el = (root: HTMLElement, id: string) => root.querySelector(`#${id}`) as HTMLElement;

export const PendingFadesTheBody: Story = {
	render: () => (
		<div style={{ width: 500 }}>
			{fullRow('plain')}
			{fullRow('pending', { isPending: true })}
			<Message id='nested' isPending>
				<MessageContainer>
					<MessageBlock>
						<MessageBody id='nested-body'>Nested body, as in an attachment description</MessageBody>
					</MessageBlock>
				</MessageContainer>
			</Message>
		</div>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('#pending')).toHaveClass('rcx-message--pending');
		await expect(canvasElement.querySelector('#plain')).not.toHaveClass('rcx-message--pending');
		if (isJsdom()) return;
		await expectComputed(el(canvasElement, 'plain-body'), 'opacity', '1');
		await expectComputed(el(canvasElement, 'pending-body'), 'opacity', '0.4');
		await expectComputed(el(canvasElement, 'nested-body'), 'opacity', '0.4');
	},
};

export const SequentialMinHeight: Story = {
	render: () => (
		<div style={{ width: 500 }}>
			{fullRow('first')}
			{fullRow('sequential', { sequential: true })}
		</div>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('#sequential')).toHaveClass('rcx-message--sequential');
		if (isJsdom()) return;
		const height = (id: string) => el(canvasElement, id).getBoundingClientRect().height;
		// The avatar column spans the header and the first body line, or the first body line alone in a sequential row
		await expect(height('first-left')).toBeGreaterThan(height('sequential-left'));
		await expect(height('first-left')).toBeGreaterThanOrEqual(40);
		await expect(height('sequential-left')).toBeGreaterThanOrEqual(20);
		await expect(height('sequential-left')).toBeLessThan(40);
	},
};

export const EditingState: Story = {
	render: () => (
		<div style={{ width: 500 }}>
			{fullRow('plain')}
			{fullRow('selected', { isSelected: true })}
			{fullRow('editing', { isEditing: true })}
			{fullRow('editing-selected', { isEditing: true, isSelected: true })}
			{fullRow('editing-hover', { isEditing: true, clickable: true })}
		</div>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('#editing')).toHaveClass('rcx-message--editing');
		if (isJsdom()) return;
		const paint = (id: string) => [computed(el(canvasElement, id), 'background-color'), computed(el(canvasElement, id), 'color')];
		const editing = paint('editing');
		await expect(editing).not.toEqual(paint('plain'));
		await expect(editing).not.toEqual(paint('selected'));
		// Editing wins over selected and over hover
		await expect(paint('editing-selected')).toEqual(editing);
		forcePseudo(el(canvasElement, 'editing-hover'), 'hover');
		await expectComputed(el(canvasElement, 'editing-hover'), 'background-color', editing[0]);
		await expect(paint('editing-hover')).toEqual(editing);
	},
};

export const TimestampContrastOnHover: Story = {
	render: () => <div style={{ width: 500 }}>{fullRow('row')}</div>,
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const time = el(canvasElement, 'row-time');
		const rest = computed(time, 'color');
		const bodyColor = computed(el(canvasElement, 'row-body'), 'color');
		await expect(rest).not.toBe(bodyColor);
		forcePseudo(el(canvasElement, 'row'), 'hover');
		await expectComputed(time, 'color', bodyColor);
	},
};

export const BodyClamp: Story = {
	render: () => (
		<div style={{ width: 200 }}>
			<MessageBody id='clamped' clamp={2}>
				{'A long body that would take many lines to read in this narrow column. '.repeat(8)}
			</MessageBody>
			<MessageBody id='free'>{'A long body that would take many lines to read in this narrow column. '.repeat(8)}</MessageBody>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const clamped = el(canvasElement, 'clamped');
		const lineHeight = parseFloat(computed(clamped, 'line-height'));
		const padding = parseFloat(computed(clamped, 'padding-top')) + parseFloat(computed(clamped, 'padding-bottom'));
		// Two lines tall, however much text there is
		await expect(clamped.getBoundingClientRect().height).toBeCloseTo(lineHeight * 2 + padding, 0);
		await expect(el(canvasElement, 'free').getBoundingClientRect().height).toBeGreaterThan(lineHeight * 4);
	},
};

export const BodyType: Story = {
	render: () => (
		<MessageBody id='body'>
			<span id='long'>{'unbrokenword'.repeat(40)}</span>
		</MessageBody>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const body = el(canvasElement, 'body');
		await expect(computed(body, 'overflow-x')).toBe('hidden');
		// A word longer than the column breaks instead of overflowing it
		await expect(el(canvasElement, 'long').getBoundingClientRect().width).toBeLessThanOrEqual(body.getBoundingClientRect().width);
	},
};

export const HighlightVariants: Story = {
	render: () => (
		<MessageBody>
			<MessageHighlight id='other'>other</MessageHighlight>{' '}
			<MessageHighlight id='critical' variant='critical'>
				critical
			</MessageHighlight>{' '}
			<MessageHighlight id='relevant' variant='relevant'>
				relevant
			</MessageHighlight>{' '}
			<MessageHighlight id='link' variant='link'>
				link
			</MessageHighlight>{' '}
			<MessageHighlight id='clickable' clickable tabIndex={0}>
				clickable
			</MessageHighlight>
		</MessageBody>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const ids = ['other', 'critical', 'relevant', 'link'];
		const colors = ids.map((id) => computed(el(canvasElement, id), 'color'));
		await expect(new Set(colors).size).toBe(4);
		for (const id of [...ids, 'clickable']) {
			await expect([id, computed(el(canvasElement, id), 'white-space')]).toEqual([id, 'nowrap']);
			await expect([id, computed(el(canvasElement, id), 'font-weight')]).toEqual([id, '500']);
		}
		await expect(computed(el(canvasElement, 'clickable'), 'color')).toBe(colors[0]);

		const clickable = el(canvasElement, 'clickable');
		await expect(computed(el(canvasElement, 'other'), 'cursor')).not.toBe('pointer');
		await expect(computed(clickable, 'cursor')).toBe('pointer');
		await expect(computed(clickable, 'text-decoration-line')).toBe('none');
		forcePseudo(clickable, 'hover');
		await expectComputed(clickable, 'text-decoration-line', 'underline');

		const other = el(canvasElement, 'other');
		await expect(computed(other, 'outline-style')).toBe('none');
		forcePseudo(other, 'focus-visible');
		await expectComputed(other, 'outline-style', 'solid');
	},
};

export const NameContainerStates: Story = {
	render: () => (
		<div style={{ width: 400 }}>
			<MessageHeader id='header'>
				<MessageNameContainer id='button' role='button' tabIndex={0}>
					<MessageName>Name</MessageName>
				</MessageNameContainer>
				<MessageTimestamp>12:00</MessageTimestamp>
			</MessageHeader>
			<MessageNameContainer id='plain'>
				<MessageName>Name</MessageName>
			</MessageNameContainer>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const button = el(canvasElement, 'button');
		const plain = el(canvasElement, 'plain');
		await expect(computed(button, 'cursor')).toBe('pointer');
		await expect(computed(plain, 'cursor')).not.toBe('pointer');
		await expect(computed(button, 'text-decoration-line')).toBe('none');
		forcePseudo(button, 'hover');
		await expectComputed(button, 'text-decoration-line', 'underline');
		forcePseudo(plain, 'hover');
		await expect(computed(plain, 'text-decoration-line')).toBe('none');

		// In the header a long name gives way before the timestamp does
		await expect(computed(button, 'flex-shrink')).toBe('1');
		await expect(computed(plain, 'flex-shrink')).toBe('0');

		await expect(computed(button, 'outline-style')).toBe('none');
		forcePseudo(button, 'focus-visible');
		await expectComputed(button, 'outline-style', 'solid');
	},
};

export const ColumnFrames: Story = {
	render: () => (
		<div style={{ width: 500 }}>
			<Message>
				<MessageLeftContainer id='left'>
					<span>Av</span>
				</MessageLeftContainer>
				<MessageContainerFixed id='fixed'>
					<span>Av</span>
				</MessageContainerFixed>
				<MessageContainer id='container'>
					<MessageBlock id='block'>Block</MessageBlock>
					<MessageBlock id='fixed-block' fixedWidth>
						Block
					</MessageBlock>
					<MessageRoles id='roles'>
						<MessageRole>Admin</MessageRole>
					</MessageRoles>
				</MessageContainer>
			</Message>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		for (const id of ['left', 'fixed']) {
			await expect([id, computed(el(canvasElement, id), 'flex-direction')]).toEqual([id, 'column']);
		}
		// A fixed-width column, so the content starts at the same x with or without an avatar
		await expect(computed(el(canvasElement, 'left'), 'width')).toBe('36px');
		await expect(computed(el(canvasElement, 'left'), 'align-items')).toBe('flex-end');
		await expect(computed(el(canvasElement, 'block'), 'display')).toBe('flex');
		await expect(computed(el(canvasElement, 'block'), 'flex-direction')).toBe('column');
		await expect(computed(el(canvasElement, 'block'), 'max-width')).toBe('none');
		await expect(computed(el(canvasElement, 'fixed-block'), 'max-width')).toBe('368px');
		await expect(computed(el(canvasElement, 'roles'), 'overflow-x')).toBe('hidden');
	},
};

export const Emoji: Story = {
	render: () => (
		<>
			<MessageEmoji id='small' name='emoji-small' image={sprite} />
			<MessageEmoji id='big' name='emoji-big' big />
		</>
	),
	play: async ({ canvasElement }) => {
		const small = el(canvasElement, 'small');
		const big = el(canvasElement, 'big');
		// The sprite's class name is added to the element as is, and the big modifier is a class
		await expect(small).toHaveClass('rcx-message__emoji', 'emoji-small');
		await expect(big).toHaveClass('rcx-message__emoji', 'rcx-message__emoji--big', 'emoji-big');
		await expect(small).not.toHaveClass('rcx-message__emoji--big');
		if (isJsdom()) return;
		await expect(computed(small, 'background-image')).toMatch(/data:image\/gif/);
		await expect(computed(big, 'background-image')).toBe('none');
		await expect(computed(small, 'display')).toBe('inline-flex');
		await expect(small.getBoundingClientRect().width).toBe(20);
		await expect(small.getBoundingClientRect().height).toBe(20);
		await expect(big.getBoundingClientRect().width).toBe(48);
		await expect(big.getBoundingClientRect().height).toBe(48);
	},
};
