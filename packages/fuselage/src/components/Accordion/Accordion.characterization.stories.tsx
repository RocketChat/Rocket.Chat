import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { expect, fireEvent, fn, userEvent, waitFor } from 'storybook/test';

import Accordion from './Accordion';
import AccordionItem from './AccordionItem';
import {
	ariaSnapshot,
	classContract,
	computed,
	expectComputed,
	expectForwards,
	expectTabOrder,
	forcePseudo,
	isJsdom,
} from '../../testing/g0';

// G0 characterization of Accordion and AccordionItem on their develop implementation. A rewrite passes these unedited, in jest and
// in the compiled zero-runtime Storybook; see src/testing/README.md.
export default {
	title: 'Characterization/Accordion',
	component: Accordion,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Accordion>;

type Story = StoryObj<typeof Accordion>;

const bar = (root: Element, index = 0) => root.querySelectorAll<HTMLElement>('.rcx-accordion-item__bar')[index];
const panel = (root: Element, index = 0) => root.querySelectorAll<HTMLElement>('.rcx-accordion-item__panel')[index];

// Hyphenated attributes are the only ones the props types let through to the root and to the item's section
export const Forwarding: Story = {
	render: () => (
		<Accordion data-qa='accordion-qa' data-anything='accordion-anything' aria-label='accordion label'>
			<AccordionItem
				title='Title'
				className='consumer-class'
				data-qa-section='general'
				data-qa-type='section-title'
				data-qa='item-qa'
				data-anything='item-anything'
				aria-label='item label'
			>
				Content
			</AccordionItem>
		</Accordion>
	),
	play: async ({ canvasElement }) => {
		await expectForwards(canvasElement, '.rcx-accordion', {
			'data-qa': 'accordion-qa',
			'data-anything': 'accordion-anything',
			'aria-label': 'accordion label',
		});
		const section = canvasElement.querySelector('.rcx-accordion-item') as HTMLElement;
		await expectForwards(canvasElement, section, {
			'className': 'consumer-class',
			'data-qa': 'item-qa',
			'data-anything': 'item-anything',
			'aria-label': 'item label',
		});
		await expect(section.tagName).toBe('SECTION');
		await expect(section).toHaveAttribute('data-qa-section', 'general');
		await expect(section).toHaveAttribute('data-qa-type', 'section-title');
	},
};

// End-to-end tests find a section's heading as `[data-qa-section="…"] h2`
export const SectionHeadingLocator: Story = {
	render: () => (
		<Accordion>
			<AccordionItem title='General' data-qa-section='general'>
				Content
			</AccordionItem>
		</Accordion>
	),
	play: async ({ canvasElement }) => {
		const heading = canvasElement.querySelector('[data-qa-section="general"] h2') as HTMLElement;
		await expect(heading).toHaveTextContent('General');
		await expect(heading).toHaveClass('rcx-accordion-item__title');
		await expect(heading).toHaveAttribute('id');
		await expect(bar(canvasElement).closest('[data-qa-section="general"]')).not.toBeNull();
	},
};

export const BarAndPanelAttributes: Story = {
	render: () => (
		<Accordion>
			<AccordionItem title='Title'>Content</AccordionItem>
		</Accordion>
	),
	play: async ({ canvasElement }) => {
		const button = bar(canvasElement);
		const content = panel(canvasElement);
		const heading = canvasElement.querySelector('h2') as HTMLElement;
		await expect(button).toHaveAttribute('role', 'button');
		await expect(button).toHaveAttribute('tabindex', '0');
		await expect(button).toHaveAttribute('aria-expanded', 'false');
		await expect(button).toHaveAttribute('aria-controls', content.id);
		await expect(content.id).not.toBe('');
		await expect(heading.id).not.toBe('');
		await expect(button).not.toHaveAttribute('aria-disabled');
		await expect(button.querySelector('.rcx-chevron, .rcx-icon')).not.toBeNull();
	},
};

export const ClickToggles: Story = {
	render: () => (
		<Accordion>
			<AccordionItem title='Title'>Content</AccordionItem>
		</Accordion>
	),
	play: async ({ canvasElement }) => {
		const button = bar(canvasElement);
		await userEvent.click(button);
		await expect(button).toHaveAttribute('aria-expanded', 'true');
		await expect(panel(canvasElement)).toHaveClass('rcx-accordion-item__panel--expanded');
		// The click hands the focus back, so the bar does not keep the focus ring of a mouse press
		await expect(button).not.toHaveFocus();

		await userEvent.click(button);
		await expect(button).toHaveAttribute('aria-expanded', 'false');
		await expect(panel(canvasElement)).not.toHaveClass('rcx-accordion-item__panel--expanded');
	},
};

export const KeyboardToggles: Story = {
	render: () => (
		<Accordion>
			<AccordionItem title='Title'>Content</AccordionItem>
		</Accordion>
	),
	play: async ({ canvasElement }) => {
		const button = bar(canvasElement);
		button.focus();
		await userEvent.keyboard('{Enter}');
		await expect(button).toHaveAttribute('aria-expanded', 'true');
		await userEvent.keyboard(' ');
		await expect(button).toHaveAttribute('aria-expanded', 'false');

		// A held key repeats, and toggles once
		await fireEvent.keyDown(button, { key: 'Enter', repeat: true });
		await expect(button).toHaveAttribute('aria-expanded', 'false');

		// Other keys, and a key pressed on a descendant, do nothing
		await userEvent.keyboard('a');
		await userEvent.keyboard('{Tab}');
		await fireEvent.keyDown(canvasElement.querySelector('h2') as HTMLElement, { key: 'Enter' });
		await expect(button).toHaveAttribute('aria-expanded', 'false');
	},
};

export const TabOrder: Story = {
	render: () => (
		<Accordion>
			<AccordionItem title='One'>Content</AccordionItem>
			<AccordionItem title='Two' disabled>
				Content
			</AccordionItem>
			<AccordionItem title='Three' tabIndex={-1}>
				Content
			</AccordionItem>
			<AccordionItem title='Four'>Content</AccordionItem>
		</Accordion>
	),
	play: async ({ canvasElement }) => {
		// A disabled item and one with `tabIndex={-1}` are not tab stops
		await expectTabOrder([bar(canvasElement, 0), bar(canvasElement, 3)]);
		await expect(bar(canvasElement, 2)).toHaveAttribute('tabindex', '-1');
	},
};

export const Controlled: Story = {
	render: function Render() {
		const [log, setLog] = useState<boolean[]>([]);
		return (
			<>
				<Accordion>
					<AccordionItem title='Title' expanded={false} onToggle={(next) => setLog((previous) => [...previous, next])}>
						Content
					</AccordionItem>
				</Accordion>
				<output>{log.join(',')}</output>
			</>
		);
	},
	play: async ({ canvasElement }) => {
		const button = bar(canvasElement);
		await userEvent.click(button);
		await expect(canvasElement.querySelector('output')).toHaveTextContent('true');
		// Controlled: only the prop moves the state
		await expect(button).toHaveAttribute('aria-expanded', 'false');
	},
};

const onToggle = fn();

export const Uncontrolled: Story = {
	render: () => (
		<Accordion>
			<AccordionItem title='Open' defaultExpanded onToggle={onToggle}>
				Content
			</AccordionItem>
		</Accordion>
	),
	play: async ({ canvasElement }) => {
		onToggle.mockClear();
		const button = bar(canvasElement);
		await expect(button).toHaveAttribute('aria-expanded', 'true');
		await expect(panel(canvasElement)).toHaveClass('rcx-accordion-item__panel--expanded');
		await userEvent.click(button);
		await expect(onToggle).toHaveBeenCalledWith(false);
		await expect(button).toHaveAttribute('aria-expanded', 'false');
	},
};

export const Disabled: Story = {
	render: () => (
		<Accordion>
			<AccordionItem title='Disabled' disabled onToggle={onToggle}>
				Content
			</AccordionItem>
		</Accordion>
	),
	play: async ({ canvasElement }) => {
		onToggle.mockClear();
		const button = bar(canvasElement);
		await expect(button).toHaveAttribute('aria-disabled', 'true');
		await expect(button).not.toHaveAttribute('tabindex');
		await expect(button).toHaveClass('rcx-accordion-item__bar--disabled');

		await userEvent.click(button);
		await fireEvent.keyDown(button, { key: 'Enter' });
		await expect(onToggle).not.toHaveBeenCalled();
		await expect(button).toHaveAttribute('aria-expanded', 'false');
	},
};

export const Noncollapsible: Story = {
	render: () => (
		<Accordion>
			<AccordionItem title='Fixed' noncollapsible onToggle={onToggle}>
				Content
			</AccordionItem>
			<AccordionItem title=''>Titleless</AccordionItem>
		</Accordion>
	),
	play: async ({ canvasElement }) => {
		onToggle.mockClear();
		const button = bar(canvasElement);
		const heading = canvasElement.querySelector('h2') as HTMLElement;
		await expect(button).toHaveAttribute('aria-disabled', 'true');
		await expect(button).toHaveAttribute('aria-expanded', 'true');
		await expect(button).toHaveAttribute('aria-labelledby', heading.id);
		await expect(button).not.toHaveAttribute('tabindex');
		await expect(button.querySelector('.rcx-icon')).toBeNull();
		await expect(panel(canvasElement, 0)).toHaveClass('rcx-accordion-item__panel--expanded');

		await userEvent.click(button);
		await expect(onToggle).not.toHaveBeenCalled();

		// Without a title there is no bar at all, and the panel is always open
		await expect(canvasElement.querySelectorAll('.rcx-accordion-item__bar')).toHaveLength(1);
		await expect(panel(canvasElement, 1)).toHaveClass('rcx-accordion-item__panel--expanded');
	},
};

export const BarPropsOverride: Story = {
	render: () => (
		<Accordion>
			<AccordionItem title='Title' tabIndex={-2}>
				Content
			</AccordionItem>
		</Accordion>
	),
	play: async ({ canvasElement }) => {
		await expect(bar(canvasElement)).toHaveAttribute('tabindex', '-2');
	},
};

const everyVariation = (
	<Accordion>
		<AccordionItem title='Collapsed' />
		<AccordionItem title='Expanded' defaultExpanded />
		<AccordionItem title='Disabled' disabled />
		<AccordionItem title='Fixed' noncollapsible />
		<AccordionItem title='' />
	</Accordion>
);

// The panels stay empty: a collapsed panel is visibility:hidden by its stylesheet, which jsdom does not load
export const AriaTree: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(ariaSnapshot(canvasElement)).toBe(
			[
				'- button "Collapsed" [expanded=false]:',
				'  - heading "Collapsed" [level=2]',
				'- button "Expanded" [expanded]:',
				'  - heading "Expanded" [level=2]',
				'- button "Disabled" [disabled] [expanded=false]:',
				'  - heading "Disabled" [level=2]',
				'- button "Fixed" [disabled] [expanded]:',
				'  - heading "Fixed" [level=2]',
			].join('\n'),
		);
	},
};

export const ClassContract: Story = {
	render: () => everyVariation,
	play: async ({ canvasElement }) => {
		await expect(classContract(canvasElement)).toBe(
			[
				'root > div: rcx-accordion rcx-box rcx-box--animated rcx-box--full',
				'root > div > section[0]: rcx-accordion-item rcx-box rcx-box--full',
				'root > div > section[0] > div[0]: rcx-accordion-item__bar rcx-box rcx-box--animated rcx-box--full',
				'root > div > section[0] > div[0] > h2: rcx-accordion-item__title rcx-box rcx-box--full',
				'root > div > section[0] > div[0] > span: rcx-box rcx-box--full rcx-chevron',
				'root > div > section[0] > div[0] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > section[0] > div[1]: rcx-accordion-item__panel rcx-box rcx-box--animated rcx-box--full',
				'root > div > section[1]: rcx-accordion-item rcx-box rcx-box--full',
				'root > div > section[1] > div[0]: rcx-accordion-item__bar rcx-box rcx-box--animated rcx-box--full',
				'root > div > section[1] > div[0] > h2: rcx-accordion-item__title rcx-box rcx-box--full',
				'root > div > section[1] > div[0] > span: rcx-box rcx-box--full rcx-chevron rcx-chevron--up',
				'root > div > section[1] > div[0] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > section[1] > div[1]: rcx-accordion-item__panel rcx-accordion-item__panel--expanded rcx-box rcx-box--animated rcx-box--full',
				'root > div > section[2]: rcx-accordion-item rcx-box rcx-box--full',
				'root > div > section[2] > div[0]: rcx-accordion-item__bar rcx-accordion-item__bar--disabled rcx-box rcx-box--animated rcx-box--full',
				'root > div > section[2] > div[0] > h2: rcx-accordion-item__title rcx-box rcx-box--full',
				'root > div > section[2] > div[0] > span: rcx-box rcx-box--full rcx-chevron',
				'root > div > section[2] > div[0] > span > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-chevron-down',
				'root > div > section[2] > div[1]: rcx-accordion-item__panel rcx-box rcx-box--animated rcx-box--full',
				'root > div > section[3]: rcx-accordion-item rcx-box rcx-box--full',
				'root > div > section[3] > div[0]: rcx-accordion-item__bar rcx-box rcx-box--animated rcx-box--full',
				'root > div > section[3] > div[0] > h2: rcx-accordion-item__title rcx-box rcx-box--full',
				'root > div > section[3] > div[1]: rcx-accordion-item__panel rcx-accordion-item__panel--expanded rcx-box rcx-box--animated rcx-box--full',
				'root > div > section[4]: rcx-accordion-item rcx-box rcx-box--full',
				'root > div > section[4] > div: rcx-accordion-item__panel rcx-accordion-item__panel--expanded rcx-box rcx-box--animated rcx-box--full',
			].join('\n'),
		);
	},
};

export const PanelVisibility: Story = {
	render: () => (
		<Accordion>
			<AccordionItem title='Collapsed'>Hidden content</AccordionItem>
			<AccordionItem title='Expanded' defaultExpanded>
				Shown content
			</AccordionItem>
		</Accordion>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		await expect(computed(panel(canvasElement, 0), 'visibility')).toBe('hidden');
		await expect(computed(panel(canvasElement, 0), 'height')).toBe('0px');
		await expect(computed(panel(canvasElement, 1), 'visibility')).toBe('visible');
		await expect(computed(panel(canvasElement, 1), 'height')).not.toBe('0px');

		await userEvent.click(bar(canvasElement, 0));
		await expectComputed(panel(canvasElement, 0), 'visibility', 'visible');
	},
};

export const InteractiveStates: Story = {
	render: () => (
		<Accordion>
			<AccordionItem title='Interactive'>Content</AccordionItem>
			<AccordionItem title='Disabled' disabled>
				Content
			</AccordionItem>
			<AccordionItem title='Fixed' noncollapsible>
				Content
			</AccordionItem>
		</Accordion>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const [interactive, disabled, fixed] = [0, 1, 2].map((index) => bar(canvasElement, index));

		await expect(computed(interactive, 'cursor')).toBe('pointer');
		await expect(computed(disabled, 'cursor')).toBe('not-allowed');
		await expect(computed(fixed, 'cursor')).not.toBe('pointer');

		// The bar tints on hover only when it can be toggled
		const rest = computed(interactive, 'background-color');
		forcePseudo(interactive, 'hover');
		await waitFor(() => expect(computed(interactive, 'background-color')).not.toBe(rest));

		const restDisabled = computed(disabled, 'background-color');
		forcePseudo(disabled, 'hover');
		await expect(computed(disabled, 'background-color')).toBe(restDisabled);
		const restFixed = computed(fixed, 'background-color');
		forcePseudo(fixed, 'hover');
		await expect(computed(fixed, 'background-color')).toBe(restFixed);
	},
};

export const FocusRing: Story = {
	render: () => (
		<Accordion>
			<AccordionItem title='Interactive'>Content</AccordionItem>
		</Accordion>
	),
	play: async ({ canvasElement }) => {
		if (isJsdom()) return;
		const interactive = bar(canvasElement);
		const restShadow = computed(interactive, 'box-shadow');
		const restBorder = computed(interactive, 'border-top-color');

		// `:focus`, not `:focus-visible`: a mouse focus shows the ring too, until the click hands the focus back
		forcePseudo(interactive, 'focus');
		await waitFor(() => expect(computed(interactive, 'box-shadow')).not.toBe(restShadow));
		await waitFor(() => expect(computed(interactive, 'border-top-color')).not.toBe(restBorder));
	},
};
