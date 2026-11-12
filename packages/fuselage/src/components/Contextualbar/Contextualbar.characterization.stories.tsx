import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import {
	Contextualbar,
	ContextualbarAction,
	ContextualbarActions,
	ContextualbarButton,
	ContextualbarContent,
	ContextualbarEmptyContent,
	ContextualbarFooter,
	ContextualbarHeader,
	ContextualbarIcon,
	ContextualbarSection,
	ContextualbarSkeleton,
	ContextualbarTitle,
} from '.';
import { ariaSnapshot, classContract, computed, expectForwards, isJsdom } from '../../testing/g0';

// G0 characterization of the Contextualbar family on its develop implementation. A rewrite passes these unedited, in jest and in
// the compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Contextualbar',
	component: Contextualbar,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Contextualbar>;

type Story = StoryObj<typeof Contextualbar>;

const forwarded = (name: string) => ({
	'className': `${name}-class`,
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const el = (root: ParentNode, selector: string) => root.querySelector(selector) as HTMLElement;

const handlersOf = () => ({ onClick: fn(), onFocus: fn(), onBlur: fn(), onMouseEnter: fn(), onMouseLeave: fn(), onKeyDown: fn() });
const barHandlers = handlersOf();
const barRef = createRef<HTMLElement>();
const contentRef = createRef<HTMLElement>();
const titleRef = createRef<HTMLHeadingElement>();

export const Forwarding: Story = {
	render: () => (
		<Contextualbar ref={barRef} {...forwarded('bar')} {...barHandlers}>
			<ContextualbarHeader {...forwarded('header')}>
				<ContextualbarTitle ref={titleRef} {...forwarded('title')}>
					Title
				</ContextualbarTitle>
			</ContextualbarHeader>
			<ContextualbarSection {...forwarded('section')}>Section</ContextualbarSection>
			<ContextualbarContent ref={contentRef} {...forwarded('content')}>
				Content
			</ContextualbarContent>
			<ContextualbarFooter {...forwarded('footer')}>Footer</ContextualbarFooter>
		</Contextualbar>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-vertical-bar', { ...forwarded('bar'), ref: barRef, handlers: barHandlers });
		await expectForwards(canvasElement, '.rcx-vertical-bar__header', forwarded('header'));
		await expectForwards(canvasElement, '.rcx-vertical-bar__title', { ...forwarded('title'), ref: titleRef });
		await expectForwards(canvasElement, '.rcx-vertical-bar__section', forwarded('section'));
		await expectForwards(canvasElement, '.rcx-vertical-bar__content', { ...forwarded('content'), ref: contentRef });
		await expectForwards(canvasElement, '.rcx-vertical-bar__footer', forwarded('footer'));
	},
};

// The room's end-to-end tests find the bar, and a thread's composer inside it, by this class
export const LocatorClasses: Story = {
	render: () => (
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarTitle>Title</ContextualbarTitle>
			</ContextualbarHeader>
			<ContextualbarContent>Content</ContextualbarContent>
		</Contextualbar>
	),
	play: async ({ canvasElement }) => {
		const bar = el(canvasElement, '.rcx-vertical-bar');
		await expect(bar.tagName).toBe('DIV');
		await expect(bar).toHaveClass('rcx-box', 'rcx-box--full');
		await expect(
			el(bar, ':scope > .rcx-vertical-bar__header > .rcx-vertical-bar__header-inner > h5.rcx-vertical-bar__title'),
		).toHaveTextContent('Title');
		await expect(el(bar, ':scope > .rcx-vertical-bar__content')).toHaveTextContent('Content');
	},
};

export const Actions: Story = {
	render: () => (
		<ContextualbarHeader>
			<ContextualbarIcon name='info' />
			<ContextualbarTitle>Title</ContextualbarTitle>
			<ContextualbarActions>
				<ContextualbarAction name='cross' title='Close' onClick={barHandlers.onClick} />
				<ContextualbarAction name='kebab' title='Menu' disabled />
			</ContextualbarActions>
			<ContextualbarButton>Done</ContextualbarButton>
		</ContextualbarHeader>
	),
	play: async ({ canvasElement }) => {
		barHandlers.onClick.mockClear();
		const [close, menu] = [...canvasElement.querySelectorAll<HTMLButtonElement>('.rcx-button-group button')];
		await expect(close).toHaveAttribute('title', 'Close');
		await userEvent.click(close);
		await expect(barHandlers.onClick).toHaveBeenCalledTimes(1);
		await expect(menu).toBeDisabled();
		await expect(el(canvasElement, '.rcx-icon--name-info')).not.toBeNull();
		await expect(canvasElement.querySelector('button.rcx-button--small-square, button.rcx-button--small')).not.toBeNull();
	},
};

export const EmptyContent: Story = {
	render: () => (
		<>
			<ContextualbarEmptyContent id='default' />
			<ContextualbarEmptyContent id='custom' icon='circle-exclamation' title='Nothing here' subtitle='Try again' flush />
		</>
	),
	play: async ({ canvasElement }) => {
		const fallback = el(canvasElement, '#default');
		await expect(fallback).toHaveClass('rcx-vertical-bar__content');
		await expect(el(fallback, '.rcx-vertical-bar__empty')).toHaveTextContent('Nothing Found');
		await expect(el(fallback, '.rcx-states__subtitle')).toBeNull();

		const custom = el(canvasElement, '#custom');
		await expect(custom).toHaveClass('rcx-vertical-bar__content--flush');
		await expect(el(custom, '.rcx-states__title')).toHaveTextContent('Nothing here');
		await expect(el(custom, '.rcx-states__subtitle')).toHaveTextContent('Try again');
	},
};

export const Skeleton: Story = {
	render: () => <ContextualbarSkeleton id='skeleton' position='relative' />,
	play: async ({ canvasElement }) => {
		const bar = el(canvasElement, '#skeleton');
		await expect(bar).toHaveClass('rcx-vertical-bar', 'rcx-vertical-bar--position-relative');
		await expect(el(bar, '.rcx-vertical-bar__header .rcx-skeleton')).not.toBeNull();
		await expect(bar.querySelectorAll('.rcx-vertical-bar__skeleton .rcx-skeleton')).toHaveLength(6);
	},
};

const everyVariation = (
	<>
		<Contextualbar>
			<ContextualbarHeader>
				<ContextualbarIcon name='info' />
				<ContextualbarTitle>Title</ContextualbarTitle>
				<ContextualbarActions>
					<ContextualbarAction name='cross' title='Close' />
				</ContextualbarActions>
			</ContextualbarHeader>
			<ContextualbarSection>Section</ContextualbarSection>
			<ContextualbarContent spaced>Spaced</ContextualbarContent>
			<ContextualbarContent flush>Flush</ContextualbarContent>
			<ContextualbarEmptyContent title='Empty' />
			<ContextualbarFooter>Footer</ContextualbarFooter>
		</Contextualbar>
		<Contextualbar stretch position='absolute' />
		<Contextualbar position='fixed' />
		<Contextualbar position='relative' />
		<Contextualbar position='static' />
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- heading "Title" [level=5]',
				'- group:',
				'  - button "Close"',
				'- text: "Section"',
				'- text: "Spaced"',
				'- text: "Flush"',
				'- heading "Empty" [level=3]',
				'- text: "Footer"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div[0]: rcx-box rcx-box--full rcx-vertical-bar',
				'root > div[0] > div[0]: rcx-box rcx-box--full rcx-vertical-bar__header',
				'root > div[0] > div[0] > div: rcx-box rcx-box--full rcx-vertical-bar__header-inner',
				'root > div[0] > div[0] > div > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-info',
				'root > div[0] > div[0] > div > h5: rcx-box rcx-box--full rcx-vertical-bar__title',
				'root > div[0] > div[0] > div > div: rcx-button-group rcx-button-group--align-start',
				'root > div[0] > div[0] > div > div > button: rcx-box rcx-box--full rcx-button rcx-button--icon rcx-button--small-square rcx-button--square',
				'root > div[0] > div[0] > div > div > button > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-cross',
				'root > div[0] > div[1]: rcx-box rcx-box--full rcx-vertical-bar__section',
				'root > div[0] > div[2]: rcx-box rcx-box--full rcx-vertical-bar__content rcx-vertical-bar__content--spaced',
				'root > div[0] > div[3]: rcx-box rcx-box--full rcx-vertical-bar__content rcx-vertical-bar__content--flush',
				'root > div[0] > div[4]: rcx-box rcx-box--full rcx-vertical-bar__content',
				'root > div[0] > div[4] > div: rcx-box rcx-box--full rcx-vertical-bar__empty',
				'root > div[0] > div[4] > div > div: rcx-states',
				'root > div[0] > div[4] > div > div > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-magnifier rcx-states__icon',
				'root > div[0] > div[4] > div > div > h3: rcx-states__title',
				'root > div[0] > div[5]: rcx-box rcx-box--full rcx-vertical-bar__footer',
				'root > div[1]: rcx-box rcx-box--full rcx-vertical-bar rcx-vertical-bar--position-absolute rcx-vertical-bar--stretch',
				'root > div[2]: rcx-box rcx-box--full rcx-vertical-bar rcx-vertical-bar--position-fixed',
				'root > div[3]: rcx-box rcx-box--full rcx-vertical-bar rcx-vertical-bar--position-relative',
				'root > div[4]: rcx-box rcx-box--full rcx-vertical-bar rcx-vertical-bar--position-static',
			].join('\n'),
		);
	},
};

export const Positions: Story = {
	render: () => (
		<div id='container' style={{ position: 'relative', width: 600, height: 300 }}>
			<Contextualbar id='default' />
			<Contextualbar id='static' position='static' />
			<Contextualbar id='relative' position='relative' />
			<Contextualbar id='absolute' position='absolute' />
			<Contextualbar id='fixed' position='fixed' />
			<Contextualbar id='stretch' position='relative' stretch />
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const position = (id: string) => computed(el(canvasElement, `#${id}`), 'position');
		await expect(['default', 'static', 'relative', 'absolute', 'fixed'].map(position)).toEqual([
			'static',
			'static',
			'relative',
			'absolute',
			'fixed',
		]);
		// The stacking and the edge are the same whatever the position
		for (const id of ['default', 'relative', 'absolute', 'fixed']) {
			await expect([id, computed(el(canvasElement, `#${id}`), 'z-index')]).toEqual([id, '10']);
		}
		// An absolute bar sits against the end edge of its container, at the top
		const absolute = el(canvasElement, '#absolute').getBoundingClientRect();
		const container = el(canvasElement, '#container').getBoundingClientRect();
		await expect(absolute.top).toBe(container.top);
		await expect(absolute.right).toBe(container.right);
		await expect(el(canvasElement, '#stretch').getBoundingClientRect().width).toBe(600);
	},
};

export const BarStyles: Story = {
	render: () => (
		<div style={{ height: 300, display: 'flex' }}>
			<Contextualbar id='bar'>
				<ContextualbarContent>Content</ContextualbarContent>
			</Contextualbar>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const bar = el(canvasElement, '#bar');
		await expect(computed(bar, 'display')).toBe('flex');
		await expect(computed(bar, 'flex-direction')).toBe('column');
		await expect(computed(bar, 'flex-shrink')).toBe('0');
		await expect(computed(bar, 'border-inline-start-width')).toBe('1px');
		await expect(computed(bar, 'background-color')).not.toBe('rgba(0, 0, 0, 0)');
		await expect(bar.getBoundingClientRect().height).toBe(300);
	},
};

export const PartStyles: Story = {
	render: () => (
		<Contextualbar>
			<ContextualbarHeader id='header'>
				<ContextualbarTitle id='title'>A very long title that does not fit the narrow header of the bar at all</ContextualbarTitle>
			</ContextualbarHeader>
			<ContextualbarSection id='section'>Section</ContextualbarSection>
			<ContextualbarContent id='content'>Content</ContextualbarContent>
			<ContextualbarContent id='flush' flush>
				Flush
			</ContextualbarContent>
			<ContextualbarContent id='spaced' spaced>
				Spaced
			</ContextualbarContent>
			<ContextualbarFooter id='footer'>Footer</ContextualbarFooter>
		</Contextualbar>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const style = (id: string, property: string) => computed(el(canvasElement, `#${id}`), property);
		const inner = el(canvasElement, '.rcx-vertical-bar__header-inner');

		await expect(style('header', 'height')).toBe('44px');
		await expect(style('header', 'padding-left')).toBe('16px');
		await expect(style('header', 'border-bottom-width')).toBe('1px');
		await expect(style('header', 'flex-shrink')).toBe('0');
		// The inner row bleeds 4px out of the padding so the focus ring of its buttons is not clipped
		await expect(computed(inner, 'margin-left')).toBe('-4px');
		await expect(computed(inner, 'padding-left')).toBe('4px');
		await expect(computed(inner, 'overflow')).toBe('hidden');
		await expect(computed(inner, 'column-gap')).toBe('8px');

		await expect(style('title', 'text-overflow')).toBe('ellipsis');
		await expect(style('title', 'white-space')).toBe('nowrap');

		await expect(style('section', 'padding-top')).toBe('16px');
		await expect(style('section', 'border-bottom-width')).toBe('1px');
		await expect(style('footer', 'padding-top')).toBe('20px');
		await expect(style('footer', 'padding-left')).toBe('16px');

		await expect(style('content', 'padding-left')).toBe('24px');
		await expect(style('content', 'overflow-y')).toBe('hidden');
		await expect(style('content', 'flex-direction')).toBe('column');
		await expect(style('flush', 'padding-left')).toBe('0px');
		await expect(style('spaced', 'padding-top')).toBe('12px');
		await expect(style('content', 'padding-top')).toBe('0px');
	},
};
