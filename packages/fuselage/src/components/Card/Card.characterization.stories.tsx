import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import Card from './Card';
import CardBody from './CardBody';
import CardCol from './CardCol';
import CardControls from './CardControls';
import CardHeader from './CardHeader';
import CardRow from './CardRow';
import CardTitle from './CardTitle';
import { ariaSnapshot, atViewport, classContract, computed, expectForwards, forcePseudo, isJsdom } from '../../testing/g0';

// G0 characterization of the Card family on its develop implementation. A rewrite passes these unedited, in jest and in the
// compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Card',
	component: Card,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Card>;

type Story = StoryObj<typeof Card>;

const bodyRef = createRef<HTMLDivElement>();

const forwarded = (name: string) => ({
	'className': `${name}-class`,
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

const handlersOf = () => ({ onClick: fn(), onFocus: fn(), onBlur: fn(), onMouseEnter: fn(), onMouseLeave: fn(), onKeyDown: fn() });

const cardHandlers = handlersOf();

export const Forwarding: Story = {
	render: () => (
		<Card {...forwarded('card')} {...cardHandlers}>
			<CardHeader {...forwarded('header')}>Header</CardHeader>
			<CardTitle {...forwarded('title')}>Title</CardTitle>
			<CardBody ref={bodyRef} {...forwarded('body')}>
				Body
			</CardBody>
			<CardRow {...forwarded('row')}>Row</CardRow>
			<CardCol {...forwarded('col')}>Col</CardCol>
			<CardControls {...forwarded('controls')}>Controls</CardControls>
		</Card>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-card', { ...forwarded('card'), handlers: cardHandlers });
		await expectForwards(canvasElement, '.rcx-card__header', forwarded('header'));
		// The title's type scale is a generated class that lands after the consumer's: the order is not part of the contract
		const { className, ...title } = forwarded('title');
		await expectForwards(canvasElement, '.rcx-card__title', title);
		await expect(canvasElement.querySelector('.rcx-card__title')).toHaveClass(className);
		await expectForwards(canvasElement, '.rcx-card__body', { ...forwarded('body'), ref: bodyRef });
		await expectForwards(canvasElement, '.rcx-card__row', forwarded('row'));
		await expectForwards(canvasElement, '.rcx-card__col', forwarded('col'));
		await expectForwards(canvasElement, '.rcx-card__controls', forwarded('controls'));
	},
};

export const Clickable: Story = {
	render: () => (
		<Card clickable role='button' tabIndex={0} onClick={cardHandlers.onClick} onKeyDown={cardHandlers.onKeyDown}>
			Press
		</Card>
	),
	play: async ({ canvasElement }) => {
		const card = canvasElement.querySelector('.rcx-card') as HTMLElement;
		cardHandlers.onClick.mockClear();
		await userEvent.click(card);
		await expect(cardHandlers.onClick).toHaveBeenCalledTimes(1);
		await expect(card).toHaveAttribute('role', 'button');
		await expect(card).toHaveAttribute('tabindex', '0');
		card.focus();
		await expect(card).toHaveFocus();
	},
};

export const TitleTags: Story = {
	render: () => (
		<>
			<CardTitle>Default</CardTitle>
			<CardTitle variant='h3'>Third</CardTitle>
			<CardTitle variant='h4'>Fourth</CardTitle>
			<CardTitle variant='h5' info='More about this'>
				Fifth
			</CardTitle>
		</>
	),
	play: async ({ canvasElement }) => {
		const titles = [...canvasElement.querySelectorAll('.rcx-card__title')];
		await expect(titles.map((title) => title.tagName)).toEqual(['H4', 'H3', 'H4', 'H5']);
		await expect(titles[3].querySelector('.rcx-label__info')).not.toBeNull();
		await expect(titles[3].querySelector('.rcx-label__info [hidden]')).toHaveTextContent('More about this');
		await expect(titles[0].querySelector('.rcx-label__info')).toBeNull();
	},
};

const everyVariation = (
	<>
		<Card>
			<CardHeader>
				<CardTitle>Vertical</CardTitle>
				<CardControls>
					<button type='button'>Action</button>
				</CardControls>
			</CardHeader>
			<CardBody>Body</CardBody>
			<CardRow>Row</CardRow>
		</Card>
		<Card horizontal>
			<CardCol>
				<CardTitle variant='h5'>Horizontal</CardTitle>
				<CardBody>Column body</CardBody>
			</CardCol>
		</Card>
		<Card hero>Hero</Card>
		<Card clickable>Clickable</Card>
		<Card horizontal hero clickable>
			All
		</Card>
	</>
);

export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- heading "Vertical" [level=4]',
				'- button "Action"',
				'- text: "Body"',
				'- text: "Row"',
				'- heading "Horizontal" [level=5]',
				'- text: "Column body"',
				'- text: "Hero"',
				'- text: "Clickable"',
				'- text: "All"',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div[0]: rcx-box rcx-box--full rcx-card rcx-card__vertical',
				'root > div[0] > div[0]: rcx-card__header',
				'root > div[0] > div[0] > h4: rcx-box rcx-box--full rcx-card__title',
				'root > div[0] > div[0] > div: rcx-card__controls',
				'root > div[0] > div[1]: rcx-box rcx-box--full rcx-card__body',
				'root > div[0] > div[2]: rcx-card__row',
				'root > div[1]: rcx-box rcx-box--full rcx-card rcx-card__horizontal',
				'root > div[1] > div: rcx-card__col',
				'root > div[1] > div > h5: rcx-box rcx-box--full rcx-card__title',
				'root > div[1] > div > div: rcx-box rcx-box--full rcx-card__body',
				'root > div[2]: rcx-box rcx-box--full rcx-card rcx-card__hero rcx-card__vertical',
				'root > div[3]: rcx-box rcx-box--full rcx-card rcx-card__clickable rcx-card__vertical',
				'root > div[4]: rcx-box rcx-box--full rcx-card rcx-card__clickable rcx-card__hero rcx-card__horizontal',
			].join('\n'),
		);
	},
};

export const Layouts: Story = {
	render: () => (
		<div style={{ width: 400 }}>
			<Card id='vertical'>
				<CardCol id='vertical-col'>Col</CardCol>
			</Card>
			<Card id='horizontal' horizontal>
				<CardCol id='horizontal-col'>Col</CardCol>
			</Card>
			<Card id='hero' hero>
				Hero
			</Card>
			<Card id='horizontal-hero' horizontal hero>
				Hero
			</Card>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const el = (id: string) => canvasElement.querySelector(`#${id}`) as HTMLElement;
		const box = (id: string) => ({
			display: computed(el(id), 'display'),
			direction: computed(el(id), 'flex-direction'),
			padding: computed(el(id), 'padding-top'),
			gap: computed(el(id), 'row-gap'),
			radius: computed(el(id), 'border-top-left-radius'),
		});

		await expect(box('vertical')).toEqual({ display: 'flex', direction: 'column', padding: '20px', gap: '24px', radius: '8px' });
		await expect(box('horizontal')).toMatchObject({ display: 'flex', direction: 'row', padding: '12px', gap: '16px' });
		await expect(computed(el('horizontal'), 'align-items')).toBe('center');
		await expect(computed(el('hero'), 'padding-top')).toBe('28px');
		await expect(computed(el('horizontal-hero'), 'padding-top')).toBe('28px');

		// A column's rows sit closer in a horizontal card than in a vertical one
		await expect(computed(el('vertical-col'), 'row-gap')).toBe('8px');
		await expect(computed(el('horizontal-col'), 'row-gap')).toBe('4px');
		await expect(computed(el('horizontal-col'), 'flex-direction')).toBe('column');
	},
};

export const Parts: Story = {
	render: () => (
		<Card>
			<CardHeader id='header'>H</CardHeader>
			<CardTitle id='title'>T</CardTitle>
			<CardControls id='controls'>C</CardControls>
			<CardRow id='row'>R</CardRow>
			<CardBody id='body'>B</CardBody>
		</Card>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const el = (id: string) => canvasElement.querySelector(`#${id}`) as HTMLElement;
		for (const id of ['header', 'title', 'controls', 'row', 'body']) {
			await expect([id, computed(el(id), 'display'), computed(el(id), 'column-gap')]).toEqual([id, 'flex', '8px']);
		}
		for (const id of ['header', 'title', 'controls', 'row']) {
			await expect([id, computed(el(id), 'align-items')]).toEqual([id, 'center']);
		}
		await expect(computed(el('body'), 'flex-grow')).toBe('1');
		await expect(computed(el('row'), 'flex-grow')).toBe('1');
		await expect(computed(el('row'), 'flex-shrink')).toBe('1');
	},
};

// `flexDirection` and `height` are the two layout props the body takes
export const BodyLayout: Story = {
	render: () => (
		<div>
			<Card id='card'>
				<CardBody id='plain'>Plain</CardBody>
				<CardBody id='column' flexDirection='column'>
					<span>One</span>
					<span>Two</span>
				</CardBody>
				<CardBody id='row' flexDirection='row'>
					<span>One</span>
					<span>Two</span>
				</CardBody>
			</Card>
			<div id='container' style={{ height: 200 }}>
				<CardBody id='full' height='full'>
					Full
				</CardBody>
			</div>
		</div>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const el = (id: string) => canvasElement.querySelector(`#${id}`) as HTMLElement;
		await expect(computed(el('column'), 'flex-direction')).toBe('column');
		await expect(computed(el('row'), 'flex-direction')).toBe('row');
		await expect(computed(el('plain'), 'flex-direction')).toBe('row');
		// `full` is the whole height of the container the body sits in
		await expect(el('full').getBoundingClientRect().height).toBe(200);
	},
};

export const ClickableStates: Story = {
	render: () => (
		<>
			<Card id='clickable' clickable tabIndex={0}>
				Clickable
			</Card>
			<Card id='plain'>Plain</Card>
		</>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const clickable = canvasElement.querySelector('#clickable') as HTMLElement;
		const plain = canvasElement.querySelector('#plain') as HTMLElement;
		const rest = computed(clickable, 'background-color');
		await expect(computed(clickable, 'cursor')).not.toBe('pointer');

		forcePseudo(clickable, 'hover');
		await expect(computed(clickable, 'cursor')).toBe('pointer');
		await expect(computed(clickable, 'background-color')).not.toBe(rest);

		const restPlain = computed(plain, 'background-color');
		forcePseudo(plain, 'hover');
		await expect(computed(plain, 'background-color')).toBe(restPlain);
		await expect(computed(plain, 'cursor')).not.toBe('pointer');

		clickable.classList.remove('pseudo-hover');
		forcePseudo(clickable, 'focus');
		await expect(computed(clickable, 'background-color')).not.toBe(rest);
		await expect(computed(clickable, 'outline-style')).toBe('none');
	},
};

const WRAP_STORY = 'characterization-card--wrap-fixture';

export const WrapFixture: Story = {
	render: () => (
		<Card horizontal>
			<div style={{ width: 300 }}>One</div>
			<div style={{ width: 300 }}>Two</div>
		</Card>
	),
};

// A horizontal card wraps its content below 600px and keeps it on one line from there
export const HorizontalWrap: Story = {
	play: async () => {
		if (isJsdom()) return;
		const wrap = (width: number) =>
			atViewport(width, WRAP_STORY, (frame) => computed(frame.querySelector('.rcx-card') as Element, 'flex-wrap'));
		await expect(await wrap(500)).toBe('wrap');
		await expect(await wrap(900)).toBe('nowrap');
	},
};
