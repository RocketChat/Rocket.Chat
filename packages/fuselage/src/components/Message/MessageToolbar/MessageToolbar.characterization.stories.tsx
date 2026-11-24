import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fireEvent, fn } from 'storybook/test';

import MessageToolbar from './MessageToolbar';
import MessageToolbarItem from './MessageToolbarItem';
import MessageToolbarWrapper from './MessageToolbarWrapper';
import { ariaSnapshot, computed, expectComputed, expectForwards, forcePseudo, isJsdom } from '../../../testing/g0';
import Message from '../Message';
import MessageBody from '../MessageBody';
import MessageContainer from '../MessageContainer';

// G0 characterization of the message toolbar on its develop implementation. A rewrite passes these unedited, in jest and in
// the compiled zero-runtime Storybook; see src/testing/README.md.
//
// Not asserted on purpose, because the approved migration changes it: whether keyboard focus on a link in the body reveals the
// toolbar (it does today, through `:has(:focus-visible)`; the rewrite reveals on the toolbar's own focus and on the row's).
export default {
	title: 'Characterization/MessageToolbar',
	component: MessageToolbar,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof MessageToolbar>;

type Story = StoryObj<typeof MessageToolbar>;

const wrapperRef = createRef<HTMLDivElement>();
const toolbarRef = createRef<HTMLDivElement>();
const itemRef = createRef<HTMLButtonElement>();
const wrapperHandlers = { onMouseEnter: fn(), onMouseLeave: fn(), onClick: fn() };
const itemHandlers = { onClick: fn(), onFocus: fn(), onBlur: fn() };
const captureHandlers = { onKeyDownCapture: fn(), onFocusCapture: fn(), onBlurCapture: fn() };

export const Forwarding: Story = {
	render: () => (
		<MessageToolbarWrapper
			ref={wrapperRef}
			className='wrapper-class'
			id='wrapper-id'
			data-qa='wrapper-qa'
			data-anything='wrapper-anything'
			aria-label='wrapper label'
			{...wrapperHandlers}
		>
			<MessageToolbar
				ref={toolbarRef}
				className='toolbar-class'
				id='toolbar-id'
				title='toolbar title'
				data-qa='toolbar-qa'
				data-anything='toolbar-anything'
				aria-label='Message actions'
				aria-orientation='horizontal'
				{...captureHandlers}
			>
				<MessageToolbarItem
					ref={itemRef}
					className='item-class'
					id='item-id'
					title='Quote'
					data-qa='item-qa'
					data-anything='item-anything'
					aria-label='Quote'
					icon='quote'
					{...itemHandlers}
				/>
			</MessageToolbar>
		</MessageToolbarWrapper>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-message-toolbar__wrapper', {
			'className': 'wrapper-class',
			'id': 'wrapper-id',
			'data-qa': 'wrapper-qa',
			'data-anything': 'wrapper-anything',
			'aria-label': 'wrapper label',
			'ref': wrapperRef,
			'handlers': wrapperHandlers,
		});

		// What react-aria's toolbar hands the group: the role, the label, the orientation, the ref and the captured handlers
		const toolbar = canvasElement.querySelector('[role=toolbar]') as HTMLElement;
		await expectForwards(canvasElement, toolbar, {
			'className': 'toolbar-class',
			'id': 'toolbar-id',
			'title': 'toolbar title',
			'data-qa': 'toolbar-qa',
			'data-anything': 'toolbar-anything',
			'aria-label': 'Message actions',
			'ref': toolbarRef,
		});
		await expect(toolbar).toHaveAttribute('aria-orientation', 'horizontal');
		await fireEvent.keyDown(toolbar);
		await fireEvent.focusIn(toolbar);
		await fireEvent.focusOut(toolbar);
		await expect(captureHandlers.onKeyDownCapture).toHaveBeenCalled();
		await expect(captureHandlers.onFocusCapture).toHaveBeenCalled();
		await expect(captureHandlers.onBlurCapture).toHaveBeenCalled();

		await expectForwards(canvasElement, '#item-id', {
			'className': 'item-class',
			'id': 'item-id',
			'title': 'Quote',
			'data-qa': 'item-qa',
			'data-anything': 'item-anything',
			'aria-label': 'Quote',
			'ref': itemRef,
			'handlers': itemHandlers,
		});
	},
};

const toolbarRow = (id: string, wrapperProps: { visible?: boolean } = {}) => (
	<Message id={id} tabIndex={0}>
		<MessageContainer>
			<MessageBody>
				<a id={`${id}-link`} href='#anchor'>
					link
				</a>
			</MessageBody>
		</MessageContainer>
		<MessageToolbarWrapper id={`${id}-wrapper`} {...wrapperProps}>
			<MessageToolbar aria-label='Message actions'>
				<MessageToolbarItem id={`${id}-item`} title='Quote' icon='quote' />
				<MessageToolbarItem title='Emoji' icon='emoji' />
			</MessageToolbar>
		</MessageToolbarWrapper>
	</Message>
);

const el = (root: HTMLElement, id: string) => root.querySelector(`#${id}`) as HTMLElement;
const outer = (root: HTMLElement, id: string) => el(root, `${id}-wrapper`).querySelector('.rcx-message-toolbar') as HTMLElement;

export const AriaTree: Story = {
	render: () => toolbarRow('pinned', { visible: true }),
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			['- link "link"', '- toolbar "Message actions":', '  - button "Quote"', '  - button "Emoji"'].join('\n'),
		);
	},
};

const reveal = async (root: HTMLElement, id: string) => {
	await expectComputed(outer(root, id), 'opacity', '1');
	await expect(computed(outer(root, id), 'pointer-events')).toBe('auto');
	await expect(computed(el(root, `${id}-wrapper`), 'display')).not.toBe('none');
};

export const RevealedByRowFocusVisible: Story = {
	render: () => <div style={{ width: 500, paddingTop: 40 }}>{toolbarRow('row')}</div>,
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		forcePseudo(el(canvasElement, 'row'), 'focus-visible');
		await expectComputed(outer(canvasElement, 'row'), 'opacity', '1');
		await expect(computed(outer(canvasElement, 'row'), 'pointer-events')).toBe('auto');
	},
};

// Tab into the toolbar: its own button takes the focus ring
export const RevealedByToolbarFocusVisible: Story = {
	render: () => <div style={{ width: 500, paddingTop: 40 }}>{toolbarRow('row')}</div>,
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		forcePseudo(el(canvasElement, 'row-item'), 'focus-visible');
		await expectComputed(outer(canvasElement, 'row'), 'opacity', '1');
		await expect(computed(outer(canvasElement, 'row'), 'pointer-events')).toBe('auto');
	},
};

// A menu opened from the toolbar pins it: the wrapper stays shown with nothing hovered or focused
export const PinnedStaysRevealed: Story = {
	render: () => <div style={{ width: 500, paddingTop: 40 }}>{toolbarRow('row', { visible: true })}</div>,
	play: async ({ canvasElement }) => {
		await expect(el(canvasElement, 'row-wrapper')).toHaveClass('rcx-message-toolbar__wrapper--visible');
		if (isJsdom()) return;
		await reveal(canvasElement, 'row');
	},
};

// Under `hover: none` (a touch device, or its emulation) a tap focuses the row, so the wrapper shows on the focus
export const WrapperShowsOnTapWhenHoverIsNone: Story = {
	render: () => <div style={{ width: 500, paddingTop: 40 }}>{toolbarRow('row')}</div>,
	play: async ({ canvasElement }) => {
		if (isJsdom() || !window.matchMedia('(hover: none)').matches) return;
		el(canvasElement, 'row').focus();
		await expectComputed(el(canvasElement, 'row-wrapper'), 'display', /^(inline-)?block$/);
	},
};

export const ToolbarFrame: Story = {
	render: () => <div style={{ width: 500, paddingTop: 40 }}>{toolbarRow('row', { visible: true })}</div>,
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const toolbar = outer(canvasElement, 'row');
		await expect(computed(toolbar, 'border-top-style')).toBe('solid');
		await expect(computed(toolbar, 'border-top-width')).toBe('1px');
		await expect(computed(toolbar, 'padding-top')).toBe('2px');
		await expect(computed(toolbar, 'margin-inline-start')).toBe('0px');
		await expect(computed(el(canvasElement, 'row-wrapper'), 'user-select')).toBe('none');
	},
};
