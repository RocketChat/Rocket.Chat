import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent } from 'storybook/test';

import Pagination from './Pagination';
import { ariaSnapshot, atViewport, classContract, computed, expectForwards, expectTabOrder, forcePseudo, isJsdom } from '../../testing/g0';

// G0 characterization of Pagination on its develop implementation. A rewrite passes these unedited, in jest and in the compiled
// zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Pagination',
	component: Pagination,
	tags: ['g0', '!autodocs'],
	args: { count: 500 },
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Pagination>;

type Story = StoryObj<typeof Pagination>;

const onSetCurrent = fn();
const onSetItemsPerPage = fn();

const pageList = (root: ParentNode) => root.querySelectorAll<HTMLElement>('.rcx-pagination__right .rcx-pagination__list > li');

// The page window as the user reads it: the page numbers and the ellipses between them
const pageWindow = (root: ParentNode) =>
	[...pageList(root)]
		.map((item) => item.querySelector('button')?.getAttribute('aria-label') ?? item.textContent)
		.filter((label) => label !== 'Previous page' && label !== 'Next page')
		.map((label) => label?.replace('Page ', ''))
		.join(' ');

const button = (root: ParentNode, label: string) => root.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;

export const Forwarding: Story = {
	args: { className: 'consumer-class', id: 'pagination-id', title: 'pagination title' },
	render: (args) => <Pagination {...args} data-qa='pagination-qa' data-anything='anything' aria-label='pagination label' />,
	play: async ({ canvasElement }) => {
		const nav = canvasElement.querySelector('nav') as HTMLElement;
		await expectForwards(canvasElement, nav, {
			'className': 'consumer-class',
			'id': 'pagination-id',
			'title': 'pagination title',
			'data-qa': 'pagination-qa',
			'data-anything': 'anything',
			'aria-label': 'pagination label',
		});
		await expect(nav).toHaveClass('rcx-pagination');
	},
};

export const DefaultLabel: Story = {
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('nav')).toHaveAttribute('aria-label', 'Pagination Navigation');
	},
};

const onNavClick = fn();

export const NavHandlers: Story = {
	render: (args) => <Pagination {...args} onClick={onNavClick} />,
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, 'nav', { handlers: { onClick: onNavClick } });
	},
};

const windows: [number, number, number, string][] = [
	// count, current offset, items per page, the window
	[0, 0, 25, ''],
	[25, 0, 25, '1'],
	[175, 0, 25, '1 2 3 4 5 6 7'],
	[200, 0, 25, '1 2 3 4 5 ⋯ 8'],
	[200, 100, 25, '1 2 3 4 5 ⋯ 8'],
	[200, 125, 25, '1 ⋯ 4 5 6 7 8'],
	[500, 0, 25, '1 2 3 4 5 ⋯ 20'],
	[500, 125, 25, '1 ⋯ 5 6 7 ⋯ 20'],
	[500, 250, 25, '1 ⋯ 10 11 12 ⋯ 20'],
	[500, 450, 25, '1 ⋯ 16 17 18 19 20'],
	[500, 100, 50, '1 2 3 4 5 ⋯ 10'],
	[1000, 700, 100, '1 ⋯ 6 7 8 9 10'],
];

export const PageWindows: Story = {
	render: () => (
		<>
			{windows.map(([count, current, itemsPerPage], index) => (
				<div key={index} data-window={index}>
					<Pagination count={count} current={current} itemsPerPage={itemsPerPage as 25} />
				</div>
			))}
		</>
	),
	play: async ({ canvasElement }) => {
		const actual = windows.map((_, index) => pageWindow(canvasElement.querySelector(`[data-window="${index}"]`) as HTMLElement));
		await expect(actual).toEqual(windows.map(([, , , expected]) => expected));
	},
};

export const CurrentAndEdges: Story = {
	args: { current: 25 },
	render: (args) => (
		<>
			<div id='middle'>
				<Pagination {...args} />
			</div>
			<div id='first'>
				<Pagination count={500} current={0} />
			</div>
			<div id='last'>
				<Pagination count={500} current={475} />
			</div>
		</>
	),
	play: async ({ canvasElement }) => {
		const [middle, first, last] = ['#middle', '#first', '#last'].map((id) => canvasElement.querySelector(id) as HTMLElement);

		await expect(button(middle, 'Page 2')).toBeDisabled();
		await expect(button(middle, 'Page 1')).toBeEnabled();
		await expect(button(middle, 'Previous page')).toBeEnabled();
		await expect(button(middle, 'Next page')).toBeEnabled();

		await expect(button(first, 'Previous page')).toBeDisabled();
		await expect(button(first, 'Next page')).toBeEnabled();
		await expect(button(last, 'Next page')).toBeDisabled();
		await expect(button(last, 'Previous page')).toBeEnabled();

		// The current items-per-page option is disabled and out of the tab order
		await expect(button(middle, 'Show 25 items per page')).toBeDisabled();
		await expect(button(middle, 'Show 25 items per page')).toHaveAttribute('tabindex', '-1');
		await expect(button(middle, 'Show 50 items per page')).toHaveAttribute('tabindex', '0');
	},
};

export const Navigation: Story = {
	args: { current: 50, itemsPerPage: 25, onSetCurrent, onSetItemsPerPage },
	play: async ({ canvasElement }) => {
		onSetCurrent.mockClear();
		onSetItemsPerPage.mockClear();

		await userEvent.click(button(canvasElement, 'Page 1'));
		await expect(onSetCurrent).toHaveBeenLastCalledWith(0);
		await userEvent.click(button(canvasElement, 'Page 5'));
		await expect(onSetCurrent).toHaveBeenLastCalledWith(100);
		await userEvent.click(button(canvasElement, 'Previous page'));
		await expect(onSetCurrent).toHaveBeenLastCalledWith(25);
		await userEvent.click(button(canvasElement, 'Next page'));
		await expect(onSetCurrent).toHaveBeenLastCalledWith(75);
		await userEvent.click(button(canvasElement, 'Page 20'));
		await expect(onSetCurrent).toHaveBeenLastCalledWith(475);

		await userEvent.click(button(canvasElement, 'Show 50 items per page'));
		await expect(onSetItemsPerPage).toHaveBeenLastCalledWith(50);
		await userEvent.click(button(canvasElement, 'Show 100 items per page'));
		await expect(onSetItemsPerPage).toHaveBeenLastCalledWith(100);

		// The current page and the current size fire nothing
		const calls = onSetCurrent.mock.calls.length;
		await userEvent.click(button(canvasElement, 'Page 3'));
		await userEvent.click(button(canvasElement, 'Show 25 items per page'));
		await expect(onSetCurrent).toHaveBeenCalledTimes(calls);
		await expect(onSetItemsPerPage).toHaveBeenCalledTimes(2);
	},
};

export const WithoutHandlers: Story = {
	play: async ({ canvasElement }) => {
		// Both callbacks are optional
		await userEvent.click(button(canvasElement, 'Page 2'));
		await userEvent.click(button(canvasElement, 'Show 50 items per page'));
		await expect(canvasElement.querySelector('nav')).not.toBeNull();
	},
};

export const KeyboardNavigation: Story = {
	args: { current: 50, onSetCurrent },
	play: async ({ canvasElement }) => {
		// Tab walks the items-per-page options (but the current one), then the page controls (but the current page)
		await expectTabOrder([
			button(canvasElement, 'Show 50 items per page'),
			button(canvasElement, 'Show 100 items per page'),
			button(canvasElement, 'Previous page'),
			button(canvasElement, 'Page 1'),
			button(canvasElement, 'Page 2'),
			button(canvasElement, 'Page 4'),
			button(canvasElement, 'Page 5'),
			button(canvasElement, 'Page 20'),
			button(canvasElement, 'Next page'),
		]);

		onSetCurrent.mockClear();
		button(canvasElement, 'Page 4').focus();
		await userEvent.keyboard('{Enter}');
		await expect(onSetCurrent).toHaveBeenLastCalledWith(75);
		await userEvent.keyboard(' ');
		await expect(onSetCurrent).toHaveBeenCalledTimes(2);
	},
};

export const Labels: Story = {
	args: {
		current: 25,
		itemsPerPageLabel: ({ count, current, itemsPerPage }) => `Per page (${count}/${current}/${itemsPerPage})`,
		showingResultsLabel: ({ count, current, itemsPerPage }) => `Rows ${current}-${itemsPerPage} of ${count}`,
	},
	play: async ({ canvasElement }) => {
		const [left, right] = [...canvasElement.querySelectorAll<HTMLElement>('.rcx-pagination__label')];
		await expect(left).toHaveTextContent('Per page (500/25/25)');
		await expect(right).toHaveTextContent('Rows 25-25 of 500');

		const [leftList, rightList] = [...canvasElement.querySelectorAll('ol')];
		await expect(leftList).toHaveAttribute('aria-labelledby', left.id);
		await expect(rightList).toHaveAttribute('aria-labelledby', right.id);
		await expect(left.id).not.toBe(right.id);
	},
};

export const DefaultLabels: Story = {
	args: { current: 25 },
	play: async ({ canvasElement }) => {
		const [left, right] = [...canvasElement.querySelectorAll<HTMLElement>('.rcx-pagination__label')];
		await expect(left).toHaveTextContent('Items per page:');
		await expect(right).toHaveTextContent('Showing results 26 - 50 of 500');
	},
};

export const LastPageResultCount: Story = {
	args: { count: 510, current: 500 },
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelectorAll('.rcx-pagination__label')[1]).toHaveTextContent('Showing results 501 - 510 of 510');
	},
};

const everyVariation = (
	<>
		<Pagination count={500} />
		<Pagination count={500} current={250} divider />
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- navigation "Pagination Navigation":',
				'  - text: "Items per page:"',
				'  - list "Items per page:":',
				'    - listitem:',
				'      - button "Show 25 items per page" [disabled]:',
				'        - text: "25"',
				'    - listitem:',
				'      - button "Show 50 items per page":',
				'        - text: "50"',
				'    - listitem:',
				'      - button "Show 100 items per page":',
				'        - text: "100"',
				'  - text: "Showing results 1 - 25 of 500"',
				'  - list "Showing results 1 - 25 of 500":',
				'    - listitem:',
				'      - button "Previous page" [disabled]',
				'    - listitem:',
				'      - button "Page 1" [disabled]:',
				'        - text: "1"',
				'    - listitem:',
				'      - button "Page 2":',
				'        - text: "2"',
				'    - listitem:',
				'      - button "Page 3":',
				'        - text: "3"',
				'    - listitem:',
				'      - button "Page 4":',
				'        - text: "4"',
				'    - listitem:',
				'      - button "Page 5":',
				'        - text: "5"',
				'    - listitem:',
				'      - text: "⋯"',
				'    - listitem:',
				'      - button "Page 20":',
				'        - text: "20"',
				'    - listitem:',
				'      - button "Next page"',
				'- navigation "Pagination Navigation":',
				'  - text: "Items per page:"',
				'  - list "Items per page:":',
				'    - listitem:',
				'      - button "Show 25 items per page" [disabled]:',
				'        - text: "25"',
				'    - listitem:',
				'      - button "Show 50 items per page":',
				'        - text: "50"',
				'    - listitem:',
				'      - button "Show 100 items per page":',
				'        - text: "100"',
				'  - text: "Showing results 251 - 275 of 500"',
				'  - list "Showing results 251 - 275 of 500":',
				'    - listitem:',
				'      - button "Previous page"',
				'    - listitem:',
				'      - button "Page 1":',
				'        - text: "1"',
				'    - listitem:',
				'      - text: "⋯"',
				'    - listitem:',
				'      - button "Page 10":',
				'        - text: "10"',
				'    - listitem:',
				'      - button "Page 11" [disabled]:',
				'        - text: "11"',
				'    - listitem:',
				'      - button "Page 12":',
				'        - text: "12"',
				'    - listitem:',
				'      - text: "⋯"',
				'    - listitem:',
				'      - button "Page 20":',
				'        - text: "20"',
				'    - listitem:',
				'      - button "Next page"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > nav[0]: rcx-box rcx-box--full rcx-pagination',
				'root > nav[0] > div[0]: rcx-pagination__left',
				'root > nav[0] > div[0] > span: rcx-pagination__label',
				'root > nav[0] > div[0] > ol: rcx-box rcx-box--full rcx-pagination__list',
				'root > nav[0] > div[0] > ol > li[0]: rcx-pagination__list-item',
				'root > nav[0] > div[0] > ol > li[0] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[0] > div[0] > ol > li[1]: rcx-pagination__list-item',
				'root > nav[0] > div[0] > ol > li[1] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[0] > div[0] > ol > li[2]: rcx-pagination__list-item',
				'root > nav[0] > div[0] > ol > li[2] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[0] > div[1]: rcx-pagination__right',
				'root > nav[0] > div[1] > span: rcx-pagination__label',
				'root > nav[0] > div[1] > ol: rcx-box rcx-box--full rcx-pagination__list',
				'root > nav[0] > div[1] > ol > li[0]: rcx-pagination__list-item',
				'root > nav[0] > div[1] > ol > li[0] > button: rcx-box rcx-box--full rcx-pagination__back',
				'root > nav[0] > div[1] > ol > li[0] > button > span: rcx-box rcx-box--full rcx-chevron rcx-chevron--left',
				'root > nav[0] > div[1] > ol > li[0] > button > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > nav[0] > div[1] > ol > li[1]: rcx-pagination__list-item',
				'root > nav[0] > div[1] > ol > li[1] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[0] > div[1] > ol > li[2]: rcx-pagination__list-item',
				'root > nav[0] > div[1] > ol > li[2] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[0] > div[1] > ol > li[3]: rcx-pagination__list-item',
				'root > nav[0] > div[1] > ol > li[3] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[0] > div[1] > ol > li[4]: rcx-pagination__list-item',
				'root > nav[0] > div[1] > ol > li[4] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[0] > div[1] > ol > li[5]: rcx-pagination__list-item',
				'root > nav[0] > div[1] > ol > li[5] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[0] > div[1] > ol > li[6]: rcx-pagination__list-item',
				'root > nav[0] > div[1] > ol > li[7]: rcx-pagination__list-item',
				'root > nav[0] > div[1] > ol > li[7] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[0] > div[1] > ol > li[8]: rcx-pagination__list-item',
				'root > nav[0] > div[1] > ol > li[8] > button: rcx-box rcx-box--full rcx-pagination__forward',
				'root > nav[0] > div[1] > ol > li[8] > button > span: rcx-box rcx-box--full rcx-chevron rcx-chevron--right',
				'root > nav[0] > div[1] > ol > li[8] > button > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > nav[1]: rcx-box rcx-box--full rcx-pagination rcx-pagination--divider',
				'root > nav[1] > div[0]: rcx-pagination__left',
				'root > nav[1] > div[0] > span: rcx-pagination__label',
				'root > nav[1] > div[0] > ol: rcx-box rcx-box--full rcx-pagination__list',
				'root > nav[1] > div[0] > ol > li[0]: rcx-pagination__list-item',
				'root > nav[1] > div[0] > ol > li[0] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[1] > div[0] > ol > li[1]: rcx-pagination__list-item',
				'root > nav[1] > div[0] > ol > li[1] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[1] > div[0] > ol > li[2]: rcx-pagination__list-item',
				'root > nav[1] > div[0] > ol > li[2] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[1] > div[1]: rcx-pagination__right',
				'root > nav[1] > div[1] > span: rcx-pagination__label',
				'root > nav[1] > div[1] > ol: rcx-box rcx-box--full rcx-pagination__list',
				'root > nav[1] > div[1] > ol > li[0]: rcx-pagination__list-item',
				'root > nav[1] > div[1] > ol > li[0] > button: rcx-box rcx-box--full rcx-pagination__back',
				'root > nav[1] > div[1] > ol > li[0] > button > span: rcx-box rcx-box--full rcx-chevron rcx-chevron--left',
				'root > nav[1] > div[1] > ol > li[0] > button > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > nav[1] > div[1] > ol > li[1]: rcx-pagination__list-item',
				'root > nav[1] > div[1] > ol > li[1] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[1] > div[1] > ol > li[2]: rcx-pagination__list-item',
				'root > nav[1] > div[1] > ol > li[3]: rcx-pagination__list-item',
				'root > nav[1] > div[1] > ol > li[3] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[1] > div[1] > ol > li[4]: rcx-pagination__list-item',
				'root > nav[1] > div[1] > ol > li[4] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[1] > div[1] > ol > li[5]: rcx-pagination__list-item',
				'root > nav[1] > div[1] > ol > li[5] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[1] > div[1] > ol > li[6]: rcx-pagination__list-item',
				'root > nav[1] > div[1] > ol > li[7]: rcx-pagination__list-item',
				'root > nav[1] > div[1] > ol > li[7] > button: rcx-box rcx-box--full rcx-pagination__link',
				'root > nav[1] > div[1] > ol > li[8]: rcx-pagination__list-item',
				'root > nav[1] > div[1] > ol > li[8] > button: rcx-box rcx-box--full rcx-pagination__forward',
				'root > nav[1] > div[1] > ol > li[8] > button > span: rcx-box rcx-box--full rcx-chevron rcx-chevron--right',
				'root > nav[1] > div[1] > ol > li[8] > button > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
			].join('\n'),
		);
	},
};

export const LinkStates: Story = {
	args: { current: 25 },
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const link = button(canvasElement, 'Page 1');
		const current = button(canvasElement, 'Page 2');
		const back = button(canvasElement, 'Previous page');

		await expect(computed(link, 'text-decoration-line')).toBe('none');
		forcePseudo(link, 'hover');
		await expect(computed(link, 'text-decoration-line')).toBe('underline');

		// The current page is plain, heavier text and never underlines
		forcePseudo(current, 'hover', 'focus');
		await expect(computed(current, 'text-decoration-line')).toBe('none');
		await expect(computed(current, 'cursor')).toBe('default');
		await expect(Number(computed(current, 'font-weight'))).toBeGreaterThan(Number(computed(link, 'font-weight')));
		await expect(computed(link, 'cursor')).toBe('pointer');
		await expect(computed(back, 'text-decoration-line')).toBe('none');
	},
};

export const DividerLine: Story = {
	args: { divider: true },
	render: (args) => (
		<>
			<div id='with'>
				<Pagination {...args} />
			</div>
			<div id='without'>
				<Pagination count={500} />
			</div>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const withDivider = canvasElement.querySelector('#with nav') as HTMLElement;
		const without = canvasElement.querySelector('#without nav') as HTMLElement;
		await expect(computed(withDivider, 'position')).toBe('relative');
		await expect(computed(without, 'position')).toBe('static');
		const line = getComputedStyle(withDivider, '::before');
		await expect(line.content).toBe('""');
		await expect(line.height).toBe('1px');
		await expect(getComputedStyle(without, '::before').content).not.toBe('""');
	},
};

// The nested iframe renders this very story file's AriaTree story: the width of its viewport picks the layout
const LAYOUT_STORY = 'characterization-pagination--aria-tree';

export const ResponsiveLayout: Story = {
	play: async () => {
		if (isJsdom()) return;
		const layout = (width: number) =>
			atViewport(width, LAYOUT_STORY, (frame) => {
				const nav = frame.querySelector('nav') as HTMLElement;
				const right = frame.querySelector('.rcx-pagination__right') as HTMLElement;
				return {
					nav: computed(nav, 'flex-direction'),
					right: computed(right, 'flex-direction'),
					padding: computed(nav, 'padding-left'),
				};
			});

		// Below 600px the page controls come first, from 600px the sections stack, from 768px they sit side by side
		await expect(await layout(500)).toEqual({ nav: 'column-reverse', right: 'column', padding: '24px' });
		await expect(await layout(700)).toEqual({ nav: 'column', right: 'row', padding: '24px' });
		await expect(await layout(900)).toEqual({ nav: 'row', right: 'row', padding: '24px' });
	},
};
